Staff Portal — Local dev notes

What I changed
- Moved inline JavaScript into `js/main.js` to centralise role handling, news rendering, portal manager, and other page logic.
- Cleaned up redundant/buggy inline scripts in `index.html`.

How to run locally
1. Open `index.html` directly in a browser (double-click). Some features use localStorage/sessionStorage and will work from file://.
2. Or serve using a simple static server for best parity (Node.js):

```powershell
# from project root (Windows PowerShell)
python -m http.server 5500
# then open http://localhost:5500/index.html
```

Testing role-based UI (DevTools console)
- Set admin:

```javascript
sessionStorage.setItem('userRole','admin');
sessionStorage.setItem('fullName','Ben O');
location.reload();
```

- Set HR:

```javascript
sessionStorage.setItem('userRole','HR');
sessionStorage.setItem('fullName','HR User');
location.reload();
```

- Set staff:

```javascript
sessionStorage.setItem('userRole','staff');
sessionStorage.setItem('fullName','Staff Member');
location.reload();
```

Notes & next steps
- Consider adding ESLint + Prettier to prevent accidental globals/duplicate declarations in the future.
- Optionally add a small automated browser test (Playwright) to assert role-based UI visibility.