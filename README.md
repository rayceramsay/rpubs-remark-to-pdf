# rpubs-remark-to-pdf

A command-line script for converting [remark.js](https://github.com/gnab/remark) HTML slides hosted on RPubs to a PDF file.

## Usage

With npx:

```sh
npx rpubs-remark-to-pdf https://rpubs.com/<your_slides>
```

By default, the output PDF is placed in the current directory and is named after the last segment of the provided RPubs URL path ("<your_slides>.pdf" in the example above). This can be customized by including a second command line argument with the desired file path:

```sh
npx rpubs-remark-to-pdf https://rpubs.com/<your_slides> some/path/name.pdf
```

## Advanced

If the remark.js slide variable uses a name other than `slideshow`, you will have to provide this by setting the env variable `REMARKJS_NAME` accordingly. For example, if the slide variable was named `mySlides`, we would do the following:

```sh
REMARKJS_NAME=mySlides npx rpubs-remark-to-pdf https://rpubs.com/<your_slides>
```

By default, the slide size is inferred automatically. You can override this by setting the `REMARKJS_SIZE` env variable to a different `width:height` value (e.g. `1024:768`):

```sh
REMARKJS_SIZE=1024:768 npx rpubs-remark-to-pdf https://rpubs.com/<your_slides>
```

## Acknowledgements

This script is based heavily off of [remarkjs-pdf](https://github.com/bellbind/remarkjs-pdf).
