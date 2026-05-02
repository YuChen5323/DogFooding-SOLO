<script lang="ts">
	export let variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let disabled: boolean = false;
	export let active: boolean = false;
	export let fullWidth: boolean = false;
	export let glow: boolean = true;

	let hovered: boolean = false;

	const sizeClasses: Record<string, string> = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-5 py-2.5 text-base',
		lg: 'px-8 py-4 text-lg'
	};

	$: buttonClasses = `
		neon-button
		neon-button--${variant}
		neon-button--${size}
		${disabled ? 'neon-button--disabled' : ''}
		${active ? 'neon-button--active' : ''}
		${fullWidth ? 'neon-button--fullwidth' : ''}
		${hovered ? 'neon-button--hovered' : ''}
		${glow ? 'neon-button--glow' : ''}
	`;
</script>

<button
	class={buttonClasses}
	{disabled}
	on:mouseenter={() => (hovered = true)}
	on:mouseleave={() => (hovered = false)}
	on:focus={() => (hovered = true)}
	on:blur={() => (hovered = false)}
	{...$$restProps}
>
	<slot />
</button>

<style>
	.neon-button {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-family: var(--font-primary);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border: 2px solid transparent;
		background: transparent;
		color: var(--accent-cyan);
		transition: all var(--transition-fast);
		cursor: pointer;
		overflow: hidden;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}

	.neon-button--fullwidth {
		width: 100%;
	}

	.neon-button::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			135deg,
			var(--accent-cyan),
			var(--accent-magenta),
			var(--accent-yellow),
			var(--accent-cyan)
		);
		background-size: 300% 300%;
		opacity: 0;
		transition: opacity var(--transition-fast);
		z-index: -1;
	}

	.neon-button--glow:hover::before,
	.neon-button--glow.neon-button--active::before {
		opacity: 1;
		animation: gradientShift 2s ease infinite;
	}

	.neon-button--primary {
		color: var(--accent-cyan);
		border-color: var(--accent-cyan);
		text-shadow: 0 0 10px var(--accent-cyan);
	}

	.neon-button--primary:hover,
	.neon-button--primary.neon-button--active {
		background: rgba(0, 255, 255, 0.1);
		box-shadow: 0 0 10px var(--accent-cyan), 0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 10px rgba(0, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	.neon-button--primary:active {
		transform: translateY(0);
	}

	.neon-button--secondary {
		color: var(--accent-magenta);
		border-color: var(--accent-magenta);
		text-shadow: 0 0 10px var(--accent-magenta);
	}

	.neon-button--secondary:hover,
	.neon-button--secondary.neon-button--active {
		background: rgba(255, 0, 255, 0.1);
		box-shadow: 0 0 10px var(--accent-magenta), 0 0 20px rgba(255, 0, 255, 0.5), inset 0 0 10px rgba(255, 0, 255, 0.2);
		transform: translateY(-2px);
	}

	.neon-button--secondary:active {
		transform: translateY(0);
	}

	.neon-button--danger {
		color: var(--accent-red);
		border-color: var(--accent-red);
		text-shadow: 0 0 10px var(--accent-red);
	}

	.neon-button--danger:hover,
	.neon-button--danger.neon-button--active {
		background: rgba(255, 0, 102, 0.1);
		box-shadow: 0 0 10px var(--accent-red), 0 0 20px rgba(255, 0, 102, 0.5), inset 0 0 10px rgba(255, 0, 102, 0.2);
		transform: translateY(-2px);
	}

	.neon-button--danger:active {
		transform: translateY(0);
	}

	.neon-button--success {
		color: var(--accent-green);
		border-color: var(--accent-green);
		text-shadow: 0 0 10px var(--accent-green);
	}

	.neon-button--success:hover,
	.neon-button--success.neon-button--active {
		background: rgba(0, 255, 0, 0.1);
		box-shadow: 0 0 10px var(--accent-green), 0 0 20px rgba(0, 255, 0, 0.5), inset 0 0 10px rgba(0, 255, 0, 0.2);
		transform: translateY(-2px);
	}

	.neon-button--success:active {
		transform: translateY(0);
	}

	.neon-button--disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	.neon-button--disabled:hover {
		transform: none;
		box-shadow: none;
		background: transparent;
	}

	@keyframes gradientShift {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	@media (max-width: 768px) {
		.neon-button:active {
			transform: scale(0.98);
		}
	}
</style>
