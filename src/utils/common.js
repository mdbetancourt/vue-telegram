// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time. Normally, the throttled function will run
// as much as it can, without ever going more than once per `wait` duration;
// but if you'd like to disable the execution on the leading edge, pass
// `{leading: false}`. To disable execution on the trailing edge, ditto.
export function throttle(func, wait, options) {
  var context, args, result
  var timeout = null
  var previous = 0
  if (!options) options = {}
  var later = function() {
    previous = options.leading === false ? 0 : Date.now()
    timeout = null
    result = func.apply(context, args)
    if (!timeout) context = args = null
  }
  return function() {
    var now = Date.now()
    if (!previous && options.leading === false) previous = now
    var remaining = wait - (now - previous)
    context = this
    args = arguments
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      result = func.apply(context, args)
      if (!timeout) context = args = null
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining)
    }
    return result
  }
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
export function debounce(func, wait, immediate) {
  var timeout
  return function() {
    var context = this,
      args = arguments
    var later = function() {
      timeout = null
      if (!immediate) {
        func.apply(context, args)
      }
    }
    var callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) {
      func.apply(context, args)
    }
  }
}

export function readImageSize(file) {
  return new Promise(resolve => {
    let useBlob = false
    // Create a new FileReader instance
    // https://developer.mozilla.org/en/docs/Web/API/FileReader
    var reader = new FileReader()

    // Once a file is successfully readed:
    reader.addEventListener('load', function() {
      // At this point `reader.result` contains already the Base64 Data-URL
      // and we've could immediately show an image using
      // `elPreview.insertAdjacentHTML("beforeend", "<img src='"+ reader.result +"'>");`
      // But we want to get that image's width and height px values!
      // Since the File Object does not hold the size of an image
      // we need to create a new image and assign it's src, so when
      // the image is loaded we can calculate it's width and height:
      var image = new Image()
      image.addEventListener('load', function() {
        // Concatenate our HTML image info
        // var imageInfo = file.name    +' '+ // get the value of `name` from the `file` Obj
        //     image.width  +'×'+ // But get the width from our `image`
        //     image.height +' '+
        //     file.type    +' '+
        //     Math.round(file.size/1024) +'KB';

        //alert(imageInfo);
        file.photoWidth = image.width
        file.photoHeight = image.height
        // Finally append our created image and the HTML info string to our `#preview`
        //elPreview.appendChild( this );
        //elPreview.insertAdjacentHTML("beforeend", imageInfo +'<br>');

        // If we set the variable `useBlob` to true:
        // (Data-URLs can end up being really large
        // `src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAA...........etc`
        // Blobs are usually faster and the image src will hold a shorter blob name
        // src="blob:http%3A//example.com/2a303acf-c34c-4d0a-85d4-2136eef7d723"
        if (useBlob) {
          // Free some memory for optimal performance
          window.URL.revokeObjectURL(image.src)
        }

        resolve(file)
      })

      image.src = useBlob ? window.URL.createObjectURL(file) : reader.result
    })

    // https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
    reader.readAsDataURL(file)
  })
}
