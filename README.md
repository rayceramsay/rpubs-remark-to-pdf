# rpubs-remark-to-pdf

A commandline script for converting [remark.js](https://github.com/gnab/remark) HTML slides hosted on RPubs to a PDF file.

## Usage

With recent node.js:

```sh
$ npm install rpubs-remark-to-pdf
$ $(npm bin)/rpubs-remark-to-pdf https://rpubs.com/<your_slides>
```

Or with npx:

```sh
$ npx rpubs-remark-to-pdf rpubs-remark-to-pdf https://rpubs.com/<your_slides>
```

By default, the output PDF is placed in the same directory and is named after the RPubs URL (<your_slides>.pdf in the example above). This can be customized by including a second command line argument with the desired file path:

```sh
$ npx rpubs-remark-to-pdf rpubs-remark-to-pdf https://rpubs.com/<your_slides> some/path/output.pdf
```

## Advanced

If the remark slide variable uses a name other than `slideshow`, you will have to tell the command this by setting the env variable `REMARKJS_NAME` to the variable name.

```sh
$ REMARKJS_NAME=custom npx rpubs-remark-to-pdf rpubs-remark-to-pdf https://rpubs.com/<your_slides>
```

By default, the slide size is inferred automatically. You can also customize this by setting the `REMARKJS_SIZE` env variable to a different `width:height` value (e.g. `1024:768`).

```sh
$ REMARKJS_SIZE=1024:768 npx rpubs-remark-to-pdf rpubs-remark-to-pdf https://rpubs.com/<your_slides>
```

## Acknowledgements

This script is based heavily off of [remarkjs-pdf](https://github.com/bellbind/remarkjs-pdf).
