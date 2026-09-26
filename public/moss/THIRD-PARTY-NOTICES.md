# Third-party notices

## Apache ECharts

Moss's optional chart renderer bundles Apache ECharts 6.1.0, licensed under
Apache-2.0. The upstream distribution includes ZRender and other notices.
Complete LICENSE, NOTICE, and dependency license files are retained beside the
engine in src/vendor/. Run `npm run vendor:charts` after changing its pinned npm
version. Runtime clients use that local asset without a CDN.

Source: https://github.com/apache/echarts

## Geist Variable

The neutral theme bundles Geist Variable via @fontsource-variable/geist 5.3.0
under SIL Open Font License 1.1. The font files and complete license are retained
under src/vendor/geist/. Typography shares the same font assets across hosts.

Source: https://github.com/vercel/geist-font

## shadcn/ui reference

The neutral theme and chart recipes use shadcn/ui as a visual and feature
reference. Chart example identifiers are pinned to commit
d82b4a7d98430da156d6a8ad6973c87279a0c5e3 in the upstream MIT-licensed project.
Moss implements those recipes with Apache ECharts and shared web components.
Source references are included in each recipe and in the inventory.

Source: https://github.com/shadcn-ui/ui

MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
