
# Prius

Prius enables you to write next generation CSS in your apps today. It operates via a hybrid runtime and preprocessor. It's usable with your 

Prius is currently intended for usage inside Ember CLI applications, however it was built to be used with any JS framework.

## Installation

`ember install prius`

TODO: instructions for general usage.

## Features

### CSS custom properties and `var`

#### Example usage

```
.button {
  font-size: var(--fontSize, 1em);
}

.button-large {
  --fontSize: 2em;
}
```

## Planned features

### Mixins

#### Example usage

```
:root {
  --myMixin: {
    padding: 0.5em;
  }
}

.button {
  @apply(--myMixin)
}
```