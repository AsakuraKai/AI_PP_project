/**
 * Myers diff with detailed logging
 */

function myersDiffDebug(a: string[], b: string[]): Array<{type: 'add' | 'remove' | 'keep', line: string}> {
  const n = a.length;
  const m = b.length;
  const max = n + m;

  console.log(`\nMyers Diff Debug:`);
  console.log(`n=${n}, m=${m}, max=${max}`);
  console.log(`a=[${a.join(', ')}]`);
  console.log(`b=[${b.join(', ')}]`);

  const v: Map<number, number> = new Map();
  v.set(1, 0);

  const trace: Array<Map<number, number>> = [];

  // Find the shortest edit script
  for (let d = 0; d <= max; d++) {
    trace.push(new Map(v));
    console.log(`\n--- d=${d} ---`);

    for (let k = -d; k <= d; k += 2) {
      let x: number;

      const goDown = k === -d || (k !== d && (v.get(k - 1) || 0) < (v.get(k + 1) || 0));

      if (goDown) {
        x = v.get(k + 1) || 0;
      } else {
        x = (v.get(k - 1) || 0) + 1;
      }

      let y = x - k;

      console.log(`k=${k}: x=${x}, y=${y} (before diagonal)`);

      // Follow diagonal (matching lines)
      let diagonalSteps = 0;
      while (x < n && y < m && a[x] === b[y]) {
        console.log(`  Match: a[${x}]="${a[x]}" === b[${y}]="${b[y]}"`);
        x++;
        y++;
        diagonalSteps++;
      }

      if (diagonalSteps > 0) {
        console.log(`  After ${diagonalSteps} diagonal steps: x=${x}, y=${y}`);
      }

      v.set(k, x);

      if (x >= n && y >= m) {
        console.log(`\nReached end! x=${x}, y=${y}`);
        return backtrackDebug(a, b, trace, d);
      }
    }
  }

  return [];
}

function backtrackDebug(
  a: string[],
  b: string[],
  trace: Array<Map<number, number>>,
  d: number
): Array<{type: 'add' | 'remove' | 'keep', line: string}> {
  let x = a.length;
  let y = b.length;

  console.log(`\n--- Backtracking from d=${d}, x=${x}, y=${y} ---`);

  const script: Array<{type: 'add' | 'remove' | 'keep', line: string}> = [];

  for (let depth = d; depth >= 0; depth--) {
    const v = trace[depth];
    const k = x - y;

    console.log(`\ndepth=${depth}, k=${k}, x=${x}, y=${y}`);

    let prevK: number;
    const goDown = k === -depth || (k !== depth && (v.get(k - 1) || 0) < (v.get(k + 1) || 0));

    if (goDown) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }

    const prevX = v.get(prevK) || 0;
    const prevY = prevX - prevK;

    console.log(`  prevK=${prevK}, prevX=${prevX}, prevY=${prevY}`);

    // Add diagonal moves (matches)
    while (x > prevX && y > prevY) {
      console.log(`  keep: a[${x-1}]="${a[x - 1]}"`);
      script.unshift({
        type: 'keep',
        line: a[x - 1]
      });
      x--;
      y--;
    }

    if (depth === 0) break;

    // Add the edit operation
    if (x === prevX) {
      console.log(`  add: b[${y-1}]="${b[y - 1]}"`);
      script.unshift({
        type: 'add',
        line: b[y - 1]
      });
      y--;
    } else {
      console.log(`  remove: a[${x-1}]="${a[x - 1]}"`);
      script.unshift({
        type: 'remove',
        line: a[x - 1]
      });
      x--;
    }
  }

  return script;
}

// Test
const original = ["line1", "line2", "line4"];
const fixed = ["line1", "line2", "line3", "line4"];

const result = myersDiffDebug(original, fixed);

console.log('\n\n=== FINAL RESULT ===');
result.forEach((edit: any) => {
  console.log(`${edit.type} ${edit.line}`);
});
