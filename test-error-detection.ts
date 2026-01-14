// Test file to verify error detection system
// This file contains intentional errors for testing

// Error 1: Undefined variable
console.log(undefinedVariable);

// Error 2: Type mismatch
const num: number = "string";

// Error 3: Missing property
interface User {
    name: string;
    age: number;
}

const user: User = {
    name: "Test"
    // Missing 'age' property
};

// Error 4: Cannot find module
import { NonExistentThing } from './non-existent-module';

// Error 5: Unused variable
const unusedVar = 42;

// Error 6: Function call with wrong arguments
function greet(name: string, age: number) {
    return `Hello ${name}, you are ${age}`;
}

greet("Alice"); // Missing argument

// Error 7: Unreachable code
function test() {
    return true;
    console.log("This will never execute");
}
