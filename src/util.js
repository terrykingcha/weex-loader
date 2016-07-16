import path from 'path'
import loaderUtils from 'loader-utils'
import hash from 'hash-sum'
import { SourceMapGenerator } from 'source-map'

import * as config from './config'

export function getNameByPath (resourcePath) {
  return path.basename(resourcePath).replace(/\..*$/, '')
}

export function getFileNameWithHash (resourcePath, content) {
  const filename = path.relative('.', resourcePath)
  const cacheKey = hash(filename + content)
  return `${filename}?${cacheKey}`
}

export const FUNC_START = '#####FUN_S#####'
export const FUNC_START_REG = new RegExp('["\']' + FUNC_START, 'g')
export const FUNC_END = '#####FUN_E#####'
export const FUNC_END_REG = new RegExp(FUNC_END + '["\']', 'g')

export function stringifyFunction (key, value) {
  if (typeof value === 'function') {
    return FUNC_START + value.toString() + FUNC_END
  }
  return value
}

export function logWarn (loader, logs) {
  if (config.logLevel && logs && logs.length) {
    logs.forEach(log => {
      loader.emitWarning(log.reason + '\t@' + log.line + ':' + log.column)
    })
  }
}

export function getRequireString (loaderContext, loader, filepath) {
  return 'require(' +
                loaderUtils.stringifyRequest(
                    loaderContext,
                    `!!${loader}!${filepath}`
                ) +
           ')\n'
}

export function stringifyLoaders (loaders) {
  return loaders.map(loader => {
    if (typeof loader === 'string') {
      return loader
    }
    else {
      const name = loader.name
      const query = []
      if (loader.query) {
        for (const k in loader.query) {
          const v = loader.query[k]
          if (v != null) {
            if (v === true) {
              query.push(k)
            }
            else {
              if (v instanceof Array) {
                query.push(`${k}[]=${v.join(',')}`)
              }
              query.push(`${k}=${v}`)
            }
          }
        }
      }
      return `${name}${query.length ? ('?' + query.join('&')) : ''}`
    }
  }).join('!')
}

export function generateMap (loader, source, iterator) {
  const fileNameWithHash = getFileNameWithHash(loader.resourcePath)
  const map = new SourceMapGenerator()
  map.setSourceContent(fileNameWithHash, source)

  for (const { original, generated } of iterator) {
    map.addMapping({
      source: fileNameWithHash,
      original,
      generated
    })
  }

  return map
}

const LINE_REG = /\r?\n/g
export function splitSourceLine (source) {
  return source.split(LINE_REG)
}
