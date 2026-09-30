// Loads the logic of okf-map.html for a test, without a browser and without a change to the
// page. The page is one file on purpose, so its script exports nothing. Its code is cut into
// sections by banner comments, as "/* ---- paths */". This reads the sections that hold pure
// logic, runs them together, and returns the functions that a test names. The code under test
// is therefore the code in the page, byte for byte.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PAGE = fileURLToPath(new URL('../../okf-map.html', import.meta.url));

export const html = readFileSync(PAGE, 'utf8');

// The app is the last module script. The one before it is the Carbon bundle.
const app = html.split('<script type="module">').at(-1).split('</script>')[0];

const marks = [...app.matchAll(/^ {2}\/\* -+ ([a-zA-Z ,]+?) \*\/$/gm)].map(match => ({
  name: match[1],
  at: match.index,
}));

export const sectionNames = marks.map(mark => mark.name);

function section(name) {
  const index = marks.findIndex(mark => mark.name === name);
  if (index < 0) throw new Error(`okf-map.html has no section "${name}"`);
  return app.slice(marks[index].at, marks[index + 1]?.at ?? app.length);
}

/** Run the named sections of the app script together, and return the named functions. */
export function load(sections, functions) {
  const source = sections.map(section).join('\n');
  return new Function(`${source}\nreturn { ${functions.join(', ')} };`)();
}
