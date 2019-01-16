# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning(http://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2019-01-16
### Changed
- Fix window defined

## [1.0.2] - 2019-01-03
### Changed
- Fix protect of close idb
- Fix protect set function passin value equal null

## [1.0.1] - 2018-12-22
### Changed
- use `stores` to change store cate

## [1.0.0] - 2018-12-22
### Changed
- Use new pattern to write logical
- Update package and use webpack

## [0.5.0] - 2018-06-25
### Changed
- expire time support params pass in

## [0.4.3] - 2018-06-21
### Changed
- Add `src` to npm package

## [0.4.2] - 2018-06-21
### Changed
- Use localForage typing in local
- Fix some typing

## [0.4.1] - 2018-04-27
### Added
- Add auto clear keys when the store exceeded quota

## [0.4.0] - 2018-04-26
### Changed
- Use localStorage to store meta info, and use indexeddb to store value

## [0.3.1] - 2018-04-24
### Changed
- Some functions use utf-16 to replace utf-8

## [0.3.0] - 2018-04-24
### Added
- export typed
- Add `getExpiredKeys`, `isOverLength`, `getOverLengthKeys`, `getOldKeys`, `getSortedItems` API
- Add `oldItemsCount` option

## [0.2.0] - 2018-04-18
### Added
- Add `gets`, `keys`, `has` API
- Add compress option

### Changed
- Rename `iterate` to `each` API
- Rename `setItem` to `set` API
- Rename `getItem` to `get` API
- Rewrite `each` to support LRU

### Removed
- Remove `autoClear` option

## [0.1.0] - 2018-04-08
### Added
Init project and add all files.
