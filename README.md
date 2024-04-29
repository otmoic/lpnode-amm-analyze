# AMM App Assistant

This is an assistant tool for AMM applications, designed to process hedged orders and generate comprehensive cross-chain order details.

## Features

1. **Order Processing**:
   - The tool parses and combines user inputs, source chain, target chain, and CEX (Central Exchange) execution details into detailed cross-chain order data.

2. **Custom Scripting**:
   - Users can write custom scripts based on the processed order information for further analysis or automation.

3. **Dashboard**:
   - View and track these records in the AMM Dashboard for an intuitive understanding of order status.

4. **Cross-Chain Profit/Loss Analysis**:
   - CEX information includes cross-chain trading profit and loss analysis, providing users with a clear view of their investment performance.

## Running the Program

The project is written in TypeScript. To run it, follow these steps:

1. **Install Dependencies**:
   - Make sure you have `Node.js` installed. In the project root directory, run:

npm install



2. **Run Directly (Development Mode)**:
- For quick testing or debugging, you can run the source code using `ts-node`:

ts-node src/profit.ts



3. **Build and Run (Production Mode)**:
- For production environments, first build the project:

npx gulp

- After building, run the compiled JavaScript file:

node ./dist/profit.js