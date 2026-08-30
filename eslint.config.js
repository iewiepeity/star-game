export default[
 {ignores:["node_modules/**","test-results/**","playwright-report/**"]},
 {files:["**/*.{js,mjs}"],languageOptions:{ecmaVersion:"latest",sourceType:"module",globals:{
  window:"readonly",document:"readonly",navigator:"readonly",location:"readonly",localStorage:"readonly",sessionStorage:"readonly",caches:"readonly",self:"readonly",fetch:"readonly",CSS:"readonly",Image:"readonly",Blob:"readonly",URL:"readonly",FileReader:"readonly",AudioContext:"readonly",webkitAudioContext:"readonly",
  console:"readonly",process:"readonly",Buffer:"readonly",TextEncoder:"readonly",structuredClone:"readonly",CustomEvent:"readonly",performance:"readonly",getComputedStyle:"readonly",setTimeout:"readonly",clearTimeout:"readonly",setInterval:"readonly",clearInterval:"readonly"
 }},rules:{
  "no-undef":"error",
  "no-unreachable":"error",
  "no-dupe-keys":"error",
  "no-constant-binary-expression":"error",
  "no-unused-vars":["warn",{args:"none",caughtErrors:"none",varsIgnorePattern:"^_"}]
 }}
];
