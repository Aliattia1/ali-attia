# Ali Attia: portfolio website

A one-page portfolio for Ali Attia (AA Design Studio), interior architect and designer in Cairo. Plain HTML, CSS and JavaScript: no framework and no build step.

The look follows the brand board (AA monogram, black / charcoal / taupe / greige / ivory, Montserrat + Playfair Display). The motion follows the motion references: an AA loader that draws itself, a hero strip whose active thumbnail grows into the full-screen image, a 3D ring of interiors, folding panels for Swiss Heights, and word-by-word text reveals. With reduced motion turned on, all of it is switched off.

```
index.html          page content
css/style.css       brand palette, type, logo, layout and motion styles
js/main.js          loader, hero strip, ring, folding panels, reveals, menu, lightbox, Instagram constant
assets/img/         project images (.webp)
assets/favicon.svg  AA monogram favicon
```

## Run it locally

Double-click `index.html` to open it in a browser. Everything works from the file.

To test it the way it will run online, serve the folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy to GitHub Pages

1. Create a GitHub repository and push this folder to the `main` branch, with `index.html` at the root.
2. On GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then pick `main` and `/ (root)`, and save.
4. After about a minute the site is live at `https://<username>.github.io/<repository>/`.

All paths are relative, so the site also works from a sub-folder.

## Editing

- **Instagram:** change the handle and link in one place, at the top of `js/main.js`:
  `const INSTAGRAM = { handle: "@ali.attia.design", url: "https://www.instagram.com/ali.attia.design/" };`
- **Colours:** the brand palette is at the top of `css/style.css`. Swiss Heights uses its own red.
- **Hero slides:** each slide is one `.hero__bg` image plus one `.strip__item` button in `index.html`, in the same order.
- **Images:** replace a file in `assets/img/` and keep the same name.
