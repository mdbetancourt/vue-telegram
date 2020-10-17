export const convertTime = duration => {
  const minutes = Math.floor(duration / 60)
  const seconds = ('0' + Math.floor(duration % 60)).slice(-2)
  return `${minutes}:${seconds}`
}

export const convertSize = (num, letters = ['B', 'KB', 'MB', 'GB']) => {
  if (num < 1024) return [num.toFixed(1), letters[0]]
  return convertSize(num / 1024, letters.slice(1))
}

export function fitSize(size, max = null) {
  const inMax = max || 260
  if (!size) return { width: 0, height: 0 }

  if (size.width > size.height) {
    return {
      width: inMax,
      height: Math.floor((size.height * inMax) / size.width)
    }
  }

  return {
    width: Math.floor((size.width * inMax) / size.height),
    height: inMax
  }
}
