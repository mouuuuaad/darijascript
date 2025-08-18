import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
    
  theme: {
  	extend: {
  		colors: {
            // Updated based on new CSS variables in globals.css
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
             // Add button gradient colors if needed directly in tailwind (though CSS vars are preferred)
             'button-grad-start': 'hsl(var(--button-grad-start))',
             'button-grad-end': 'hsl(var(--button-grad-end))',
             'button-dual': 'hsl(var(--button-dual))',

  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)', // Uses the radius from CSS variables
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
      backgroundImage: { // Define gradients for buttons
        'button-primary-gradient': 'linear-gradient(to right, hsl(var(--button-grad-start)), hsl(var(--button-grad-end)))',
        'button-dual-gradient': 'linear-gradient(to right, hsl(var(--secondary)), hsl(var(--accent)))', // Example using secondary/accent
      },
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
             'rotate-glow': { // Add keyframe from globals.css if needed elsewhere
                 '0%': { transform: 'rotate(-12deg) scale(1)' },
                 '100%': { transform: 'rotate(348deg) scale(1.05)' },
             }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.3s ease-out', // Slightly slower
  			'accordion-up': 'accordion-up 0.3s ease-out',
             'rotate-glow': 'rotate-glow 15s linear infinite', // Add animation
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
