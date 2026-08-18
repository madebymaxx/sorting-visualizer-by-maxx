<div align="center">

# 🧩 Sorting Visualizer

**An interactive, block-based sorting algorithm visualizer** — built with plain JavaScript, HTML5 & CSS3. No frameworks, no libraries, no build step.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
</div>

---

## ✨ Overview

Watch six classic sorting algorithms come to life, block by block. Every comparison, swap, and overwrite is animated in real time, so you can actually *see* how each algorithm thinks — not just read pseudocode about it.

Just open `index.html` in a browser. That's it — no install, no server, no dependencies.

## 📖 Table of Contents

- [Features](#-features)
- [How It Works](#-how-it-works)
- [Controls](#-controls)
- [Algorithms Explained](#-algorithms-explained)
- [Complexity At a Glance](#-complexity-at-a-glance)
- [Project Structure](#️-project-structure)
- [Tech Stack](#️-tech-stack)
- [Getting Started](#-getting-started)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Author](#-author)

## 🎬 Features

| | |
|---|---|
| 🔢 **6 algorithms** | Bubble, Selection, Insertion, Merge, Quick, Heap Sort |
| ▶️ **Run or Step** | Auto-play the full animation, or step through one comparison/swap at a time |
| 🎲 **Dataset shapes** | Random, Reversed, Nearly sorted, Few unique — see how input shape affects each algorithm |
| ✍️ **Custom input** | Type your own comma-separated values |
| 🎚️ **Size & speed controls** | 6–30 elements, 10 speed levels |
| 📊 **Live stats** | Comparisons, writes, elapsed time, and progress update as it runs |
| 🎨 **Visual states** | Blocks light up when compared, swapped, pivoted, or locked in as sorted |
| 🌗 **Light / dark theme** | Toggle with no flash-of-wrong-theme on load; preference saved locally |

## 🧠 How It Works

Each array value is rendered as a fixed-size block that keeps its identity for the whole run:

- A **swap** physically slides two blocks to each other's slot (CSS transition on `left`)
- An **overwrite** — used only by Merge Sort, since it copies from an auxiliary buffer — flashes a new value into a slot instead of sliding
- Once a block reaches its final position, it turns **green**

| Color | Meaning |
|---|---|
| 🟧 Orange | Currently being compared |
| 🟥 Red | Currently being swapped |
| 🟪 Purple outline | Pivot (Quick Sort only) |
| 🟩 Green | Sorted — locked into final position |

## 🎮 Controls

| Control | What it does |
|---|---|
| **Algorithm** dropdown | Choose which sorting algorithm to visualize |
| **Dataset** pills | Generate a new array shaped Random / Reversed / Nearly sorted / Few unique |
| **Size** slider | Set the number of elements (6–30) |
| **Speed** slider | Set animation speed (1 = slowest, 10 = fastest) |
| **Custom values** field | Type your own comma-separated numbers and hit **Set** |
| **Run** | Auto-play the whole sort from start to finish |
| **Step** | Advance exactly one comparison/swap at a time |
| **Reset** | Restore the array to its original, unsorted order |
| 🌗 **Theme toggle** | Switch between light and dark mode |

## 📚 Algorithms Explained

### 🫧 Bubble Sort
Repeatedly walks the array comparing adjacent elements and swapping them if they're out of order. Each full pass "bubbles" the largest remaining value to the end, so the sorted region grows from the right. Simple to understand, but slow on large inputs.

| Best | Average | Worst | Space | Stable |
|---|---|---|---|---|
| O(n) | O(n²) | O(n²) | O(1) | ✅ Yes |

### 🎯 Selection Sort
On each pass, scans the entire unsorted region for the smallest value and swaps it into place at the front. The sorted region grows from the left, one confirmed minimum at a time. Makes the fewest swaps of any comparison sort, but always does O(n²) comparisons regardless of input.

| Best | Average | Worst | Space | Stable |
|---|---|---|---|---|
| O(n²) | O(n²) | O(n²) | O(1) | ❌ No |

### 🖐️ Insertion Sort
Builds the sorted region one element at a time — takes the next value and slides it backward past any larger neighbors until it lands in its correct spot, much like sorting playing cards in your hand. Very efficient on small or nearly-sorted arrays.

| Best | Average | Worst | Space | Stable |
|---|---|---|---|---|
| O(n) | O(n²) | O(n²) | O(1) | ✅ Yes |

### 🔀 Merge Sort
Recursively splits the array in half until each piece is a single element, then merges pairs of sorted pieces back together in order. The overwrite flashes you see are values being copied in from the auxiliary merge buffer. Consistently fast, but needs extra memory.

| Best | Average | Worst | Space | Stable |
|---|---|---|---|---|
| O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ Yes |

### ⚡ Quick Sort
Picks a pivot, then partitions the array so smaller values end up on its left and larger values on its right, recursing into each side. The purple outline marks the current pivot. Usually the fastest in practice, though a poor pivot choice can degrade it to O(n²).

| Best | Average | Worst | Space | Stable |
|---|---|---|---|---|
| O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ No |

### 🏔️ Heap Sort
First arranges the array into a max-heap (largest value at the root), then repeatedly swaps the root with the last unsorted slot and re-heapifies what remains, shrinking the heap by one each time. Guaranteed O(n log n) with no extra memory, but not stable and generally slower in practice than Quick Sort.

| Best | Average | Worst | Space | Stable |
|---|---|---|---|---|
| O(n log n) | O(n log n) | O(n log n) | O(1) | ❌ No |

## 📊 Complexity At a Glance

| Algorithm | Best | Average | Worst | Space | Stable |
|---|---|---|---|---|---|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | ❌ |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | ❌ |

> **Stable** means equal elements keep their original relative order after sorting.

## 🗂️ Project Structure

```
.
├── index.html   # Markup and layout
├── style.css    # Theming (light/dark), layout, and animations
└── script.js    # Sorting algorithms, step recorder/player, theme toggle
```

## 🛠️ Tech Stack

Vanilla JavaScript (ES6) · HTML5 · CSS3 — zero external libraries.

## 🚀 Getting Started

```bash
git clone https://github.com/madebymaxx/sorting-visualizer-by-maxx.git
cd sorting-visualizer-by-maxx
```

Then just open `index.html` in your browser.

## 🗺️ Roadmap

- [ ] Add more algorithms (Shell Sort, Radix Sort, Cocktail Shaker Sort)
- [ ] Sound effects tied to comparisons/swaps
- [ ] Side-by-side race mode — compare two algorithms at once
- [ ] Export animation as GIF

Have an idea? Open an issue or a PR — see below.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repo
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

## ⭐ Show Your Support

If you found this project useful or fun to play with, consider giving it a ⭐ on GitHub — it helps a lot!

## 👤 Author

Built by [**madebymaxx**](https://github.com/madebymaxx)
