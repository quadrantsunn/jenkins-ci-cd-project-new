pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    stages {
        stage('Checkout') {
            steps {
                echo '=== CHECKOUT ==='
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '=== INSTALL DEPENDENCIES ==='
                bat 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                echo '=== RUNNING TESTS ==='
                bat 'npm test'
            }
        }

        stage('Docker Check') {
            steps {
                echo '=== DOCKER CHECK ==='

                bat '''
                    whoami
                    where docker
                    docker --version
                    docker info
                '''
            }
        }

        stage('Build Docker Image') {
            steps {
                echo '=== BUILDING DOCKER IMAGE ==='

                bat "docker build -t jenkins-demo-app:%BUILD_NUMBER% ."
            }
        }

        stage('Deploy to Staging') {
            steps {
                echo '=== STARTING NEW VERSION ON STAGING PORT (OLD CONTAINER STAYS UP) ==='

                bat '''
                    echo === CLEANING UP ANY LEFTOVER STAGING CONTAINER ===
                    docker stop jenkins-demo-staging 2>NUL
                    docker rm jenkins-demo-staging 2>NUL

                    echo === STARTING STAGING CONTAINER ON PORT 3001 ===
                    docker run -d ^
                      --name jenkins-demo-staging ^
                      -p 3001:3000 ^
                      jenkins-demo-app:%BUILD_NUMBER%

                    echo === STAGING CONTAINER STATUS ===
                    docker ps -a
                '''
            }
        }

        stage('Health Check Staging') {
            steps {
                echo '=== VALIDATING NEW VERSION BEFORE TOUCHING PRODUCTION ==='

                bat '''
                    echo === WAITING FOR STAGING APP TO START ===
                    ping 127.0.0.1 -n 6 > NUL

                    echo === CHECKING STAGING HEALTH ENDPOINT ===
                    curl -f http://localhost:3001/health
                    if errorlevel 1 (
                        echo === STAGING HEALTH CHECK FAILED - ABORTING DEPLOY, PRODUCTION UNTOUCHED ===
                        docker logs jenkins-demo-staging
                        docker stop jenkins-demo-staging
                        docker rm jenkins-demo-staging
                        exit /b 1
                    )

                    echo === STAGING HEALTHY - SAFE TO PROMOTE ===
                    docker stop jenkins-demo-staging
                    docker rm jenkins-demo-staging
                '''
            }
        }

        stage('Promote to Production') {
            steps {
                echo '=== NEW VERSION VALIDATED - CUTTING OVER PRODUCTION CONTAINER ==='

                bat '''
                    echo === STOPPING OLD PRODUCTION CONTAINER ===
                    docker stop jenkins-demo 2>NUL

                    echo === REMOVING OLD PRODUCTION CONTAINER ===
                    docker rm jenkins-demo 2>NUL

                    echo === STARTING NEW PRODUCTION CONTAINER ===
                    docker run -d ^
                      --name jenkins-demo ^
                      -p 3000:3000 ^
                      jenkins-demo-app:%BUILD_NUMBER%

                    echo === CONTAINER STATUS ===
                    docker ps -a

                    echo === CONTAINER LOGS ===
                    docker logs jenkins-demo
                '''
            }
        }

        stage('Final Health Check') {
            steps {
                echo '=== CONFIRMING PRODUCTION IS SERVING TRAFFIC ==='

                bat '''
                    echo === WAITING FOR APPLICATION ===
                    ping 127.0.0.1 -n 6 > NUL

                    echo === RUNNING CONTAINERS ===
                    docker ps

                    echo === HEALTH ENDPOINT ===
                    curl -f http://localhost:3000/health
                '''
            }
        }
    }

    post {

        success {
            echo '=== CI/CD PIPELINE SUCCESS ==='
        }

        failure {
            echo '=== CI/CD PIPELINE FAILED ==='
            bat '''
                docker stop jenkins-demo-staging 2>NUL
                docker rm jenkins-demo-staging 2>NUL
            '''
        }
    }
}
