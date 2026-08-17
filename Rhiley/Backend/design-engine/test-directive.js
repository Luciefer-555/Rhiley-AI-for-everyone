const { validateTSX } = require("./lib/validateTSX");

const brokenDirective = `
use client;
import { motion } from 'framer-motion';

export default function Component() {
  return <div />;
}
`;

console.log("Testing Broken Directive (no quotes):");
const res = validateTSX(brokenDirective);
console.log(JSON.stringify(res, null, 2));
