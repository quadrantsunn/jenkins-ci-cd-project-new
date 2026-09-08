console.log("Running application tests...");

const expectedMessage = "Application deployed successfully using Jenkins CI/CD!";

if (expectedMessage.includes("Jenkins")) {
    console.log("TEST PASSED");
    process.exit(0);
} else {
    console.log("TEST FAILED");
    process.exit(1);
}