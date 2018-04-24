# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning(http://semver.org/spec/v2.0.0.html).

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
