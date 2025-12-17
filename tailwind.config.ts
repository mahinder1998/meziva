/** @type {import('tailwindcss').Config} */

module.exports = {
  prefix: 'sw-',
  content: [
    './assets/*.{liquid,js,mjs}',
    '!./assets/*.min.{js,mjs}',
    './config/*.json',
    './layout/*.liquid',
    './sections/*.liquid',
    './blocks/*.liquid',
    './snippets/*.liquid',
    './templates/**/*.{liquid,json}',
    './frontend/entrypoints/*.{js,ts}',
    './blocks/*.liquid',
  ],
  theme: {
   fontFamily: {
        // use like: sw-font-heading / sw-font-body if you mapped classes
        heading: ["Bebas Neue", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ['Proxima Nova Rg', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    extend: {
      boxShadow: {
        'tiny': '0px 0px 2px 0px rgba(0, 0, 0, 0.25)',
        'popup': '0px 0px 2px 0px rgba(0, 0, 0, 0.25)'
      },
      colors: {
        sw: {
          primary: "#f79ac3",
          accent: "#724430",
          text: "#111111",
          // optional neutrals for backgrounds
          bg: "#fff5f9",
          surface: "#FFFFFF"
        }
      },
      translate:{
        '-1/2': '-50%',
      }
    },
  },
  plugins: [
    function ({ addUtilities }) { 
      addUtilities({
        '.scrollbar-hide': {
          /* Hide scrollbar for Webkit browsers */
          '&::-webkit-scrollbar': {
            display: 'none', 
          },
          /* Hide scrollbar for IE, Edge and Firefox */
          '-ms-overflow-style': 'none', // IE and Edge
          'scrollbar-width': 'none',    // Firefox 
        },
      })
    }
  ],
}
