/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        'primary-color': '#FE724C',
        'secondary-color': '#FFC529',
        'error-message': '#EF4444',
        'light-gray': '#F6F6F6',
        'medium-gray': '#9796A1',
        'dark-gray': '#5B5B5E',
        'dark-gray-tag': '#515154',
        'border-gray': '#EEEEEE',
        'yellow-rating': '#FFC529',
        'success': '#4ADE80',
      },
      boxShadow: {
        'light-orange': '0px 6.07px 24.29px 0px #FE724C33',
        'medium-orange': '0px 20px 30px 0px #FE724C40',
        'light-yellow': '0px 5px 16px 0px #FFC5294D',
        'medium-yellow': '0px 7px 10px 0px #FFC52980;',
        'light-gray': '15px 20px 45px 0px #E9E9E940',
      },
      maxWidth: {
        content: '1200px',
      },
      screens: {
        xs: '480px',
      },
    },
  },
  plugins: [],
};
