// Shared asset URLs: these are the same files referenced by font-delivery.css.
// The two normal faces preload site-wide. The homepage also preloads the
// exact semantic homepage italic subset; interiors retain the shared face.
import newsreaderLatinSubset from "../assets/fonts/newsreader-latin-wght-normal-site.woff2?url";
import geistLatinSubset from "../assets/fonts/geist-latin-wght-normal-site.woff2?url";
import newsreaderItalicHomeSubset from "../assets/fonts/newsreader-latin-wght-italic-home.woff2?url";

export { newsreaderLatinSubset, geistLatinSubset, newsreaderItalicHomeSubset };
