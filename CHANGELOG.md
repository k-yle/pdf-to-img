# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- Support NodeJS v18 and v19
- 💥 BREAKING CHANGE: Drop support for node v10 and v12
- Remove control characters like `\x00` from PDF metadata

## 1.2.0 (2022-01-23)

- Allow parameters to be passed through to `pdfjs.getDocument` ([#119])

[#119]: https://github.com/k-yle/pdf-to-img/pull/119

## 1.1.1 (2021-07-28)

- Update pdfjs and pin dependencies due to breaking change in minor update to pdfjs

## 1.1.0 (2021-03-28)

- Accept `Buffer` and `ReadableStream` as well as a data URL or a path to a file on disk.

## 1.0.3 (2021-02-20)

- add a `scale` option for producing high-resolution images

## 1.0.2 (2021-02-02)

- make it work when jest's `testEnvironment` is set to `node`.

## 1.0.0 (2021-02-02)

- Initial release
