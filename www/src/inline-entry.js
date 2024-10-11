<%
const manifest = JSON.parse(await readFile('dist/manifest.json'));
const urlManifest = Object.fromEntries(Object.entries(manifest).map(([key, paths]) => [key, paths.map(path => path.slice(4))]));
%>

globalThis.spike = { manifest: <%= JSON.stringify(urlManifest) %> };
window.env = { API_URL: '<%= process.env.API_URL %>', VERSION: '<%= process.env.VERSION %>' }; 

<% for (const path of manifest['src/entry.js']) print(await readFile(path)); %>
