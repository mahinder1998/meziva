/** @type {import('tailwindcss').Config} */

module.exports = {
  prefix: 'mb-',
  content: [
    './assets/*.{liquid,js,mjs}',
    '!./assets/*.min.{js,mjs}',
    './config/*.json',
    './layout/*.liquid',
    './sections/*.liquid',
    './blocks/*.liquid',
    './snippets/*.liquid',
    './templates/**/*.{liquid,json}',
    './frontend/entrypoints/*.{js,ts,css}',
    './blocks/*.liquid',
  ],
  theme: {
   fontFamily: {
        // use like: mb-font-heading / mb-font-body if you mapped classes
        heading: ["Peachi", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    extend: {
      boxShadow: {
        'tiny': '0px 0px 2px 0px rgba(0, 0, 0, 0.25)',
        'popup': '0px 0px 2px 0px rgba(0, 0, 0, 0.25)'
      },
      colors: {
        mb: {
          heading: "#111111",
          subheading: "#3a3a3a",
          body: "#4a4a4a",
          muted: "#777777",
          primary: "#ff4f8b",
          accent: "#4b1f00",
          bg: "#fff5f9",
          surface: "#ffffff",
          gray: "#f2f2f2"
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
