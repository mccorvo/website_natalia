# website_natalia backup

Private backup of the working folder originally at:

```sh
/Users/mcorvo/Projects/website_natalia
```

## Restore on a new machine

```sh
git clone https://github.com/mccorvo/website_natalia.git
cd website_natalia
```

Dependencies such as `node_modules`, `.next`, build output, logs, and local secret files are intentionally not stored in Git. They are either rebuildable or risky to publish, even in a private repository.

To resume the main site:

```sh
cd natalia-nutrition-site
npm install
npm run dev
```

If you need the original Git history for `natalia-nutrition-site`, restore it from the bundle included in this backup:

```sh
git clone natalia-nutrition-site.git.bundle natalia-nutrition-site-history
```

The working files for the folder are also stored directly in this backup repository, so cloning this repo is enough to recover the project files.
