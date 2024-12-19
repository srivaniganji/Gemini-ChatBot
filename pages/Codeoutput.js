import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialLight } from "react-syntax-highlighter/dist/esm/styles/prism";

const Codeoutput = ({ code }) => {
  const executeCode = (codeString) => {
    try {
      // Evaluate the code safely
      const result = eval(codeString);
      return result;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  return (
    <div>
      <SyntaxHighlighter language="javascript" style={materialLight}>
        {code}
      </SyntaxHighlighter>
      <div>
        <strong>Output:</strong> {executeCode(code)}
      </div>
    </div>
  );
};

export default Codeoutput;
