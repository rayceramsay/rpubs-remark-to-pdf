#!/usr/bin/env node

/*
 * The following code is based off of https://github.com/bellbind/remarkjs-pdf
 */

const fs = require('fs')
const path = require('path')
const process = require('process')
const puppeteer = require('puppeteer')

main().catch((err) => {
    console.error(err)
    process.exit(20)
})

// check args
function getParams() {
    if (process.argv.length < 3 || process.argv.length > 4) {
        console.error(`USAGE: npx ${path.basename(__filename)} HTML_PATH [PDF_PATH]`)
        process.exit(1)
    }

    const html = (function asUrl(html) {
        if (/^file:\/\/\//.test(html)) return html
        if (/^https?:\/\//.test(html)) return html
        if (!fs.existsSync(html)) {
            console.error(`HTML file not found: ${html}`)
            process.exit(2)
        }
        const absPath = path.resolve(html).replace(/\\/g, '/')
        return `file://${absPath[0] === '/' ? '' : '/'}${absPath}`
    })(process.argv[2])

    const pdf =
        (function asPdf(pdf) {
            if (!pdf) return ''
            if (path.extname(pdf) !== '.pdf') {
                console.error(`PDF extension should be ".pdf": ${pdf}`)
                process.exit(3)
            }
            return pdf
        })(process.argv[3]) || pdfNameFromUrl(html)

    const sizeText = process.env.REMARKJS_SIZE
    if (sizeText && !/^\d+:\d+$/.test(sizeText)) {
        console.error(`Invalid print size: ${sizeText}`)
        process.exit(4)
    }
    const size = sizeText ? sizeText.split(':').map((s) => s >>> 0) : null

    const name = process.env.REMARKJS_NAME || 'slideshow'
    return { html, pdf, name, size }
}

function pdfNameFromUrl(url) {
    const u = new URL(url)
    const base = path.basename(u.pathname)
    if (base.length > 0) {
        const ext = path.extname(base)
        return `${ext ? base.slice(0, -ext.length) : base}.pdf`
    }
    return `${u.hostname}.pdf`
}

// main for browser lifecycle
async function main() {
    const params = getParams()
    console.log(`Converting ${params.html} to ${params.pdf} ...`)
    const browser = await puppeteer.launch()
    try {
        const rpubsHtml = params.html
        const remarkHtml = await getRemarkURLFromRpubs(browser, rpubsHtml)
        await convertPdf(browser, { ...params, html: remarkHtml })
        console.log(`Finished.`)
        await browser.close()
    } catch (err) {
        console.error(err)
        await browser.close()
        process.exit(10)
    }
}

async function getRemarkURLFromRpubs(browser, rpubsURL) {
    const page = await browser.newPage()
    await page.goto(rpubsURL)

    await page.waitForSelector('#payload iframe', { timeout: 10000 })
    remarkURL = await page
        .locator('#payload iframe')
        .map((iframe) => iframe.src)
        .wait()

    await page.close()

    return remarkURL
}

async function convertPdf(browser, { html, pdf, name, size }) {
    const page = await browser.newPage()
    await page.goto(html)

    // 1. check remark.js slideshow features
    const notFound = await page.evaluate((ss) => {
        if (typeof Function(`return ${ss}`)() !== 'object') return 'slideshow object'
        if (typeof Function(`return ${ss}`)().getRatio !== 'function') return 'slideshow.getRatio() method'
        if (typeof Function(`return ${ss}`)().getSlideCount !== 'function') return 'slideshow.getSlideCount() method'
        if (typeof Function(`return ${ss}`)().gotoNextSlide !== 'function') return 'slideshow.gotoNextSlide() method'
        return ''
    }, name)
    if (notFound) {
        throw Error(`${notFound} of remark.js is not found in the HTML`)
    }

    // 2. Extract slide size from the first slide
    const [slideWidth, slideHeight] = await page
        .locator('.remark-slides-area > .remark-slide-container >.remark-slide-scaler')
        .map((div) => [div.style.width, div.style.height])
        .wait()

    // 3. inject printing css for fullsheet
    const ratio = await page.evaluate((ss) => Function(`return ${ss}`)().getRatio(), name)
    // size by comparing chrome view-area and pdf view-area
    const [w, h] = size
        ? [`${size[0]}px`, `${size[1]}px`]
        : slideWidth && slideHeight
        ? [slideWidth, slideHeight]
        : ratio === '4:3'
        ? ['864px', '648px']
        : ['1040px', '585px']
    await page.evaluate(
        (w, h) => {
            const printStyle = document.createElement('style')
            printStyle.textContent = `
@page {
  size: ${w} ${h};
  margin: 0;
}
@media print {
  .remark-slide-scaler {
    left: 0vw !important;
    width: 100vw !important;
    top: 0vh !important;
    height: 100vh !important;
    transform: scale(1) !important;
    box-shadow: none;
  }
}`
            document.body.appendChild(printStyle)
        },
        w,
        h
    )

    // 4. once render all pages to mermaid graph rendering
    const pages = await page.evaluate((ss) => Function(`return ${ss}`)().getSlideCount(), name)
    for (let i = 1; i < pages; i++) {
        await page.evaluate((ss) => Function(`return ${ss}`)().gotoNextSlide(), name)
    }

    // 5. print pdf pages with no margin
    const [pw, ph] = await page.evaluate(() => {
        return [window.innerWidth, window.innerHeight] //maybe same as w,h
    })
    await page.pdf({
        path: pdf,
        width: `${pw}px`,
        height: `${ph}px`,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    })
}
