export const FONT_SIZE = 12;

export const styleLabelText = (label: HTMLElement) => {
  label.style.position = 'absolute';
  label.style.color = 'black';
  label.style.fontSize = `${FONT_SIZE}px`;
  label.style.lineHeight = '18px';
  label.style.padding = '0px 6px';
  label.style.transition = 'opacity 0.1s ease-in-out';
  label.style.opacity = '1';
};

export const styleTooltip = (tooltip: HTMLElement) => {
  styleLabelText(tooltip);
  tooltip.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
  tooltip.style.borderStyle = 'solid';
  tooltip.style.borderColor = 'black';
  tooltip.style.borderWidth = '1px';
  tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
  tooltip.style.opacity = '0';
};

// modified from https://observablehq.com/@siliconjazz/basic-svg-tooltip
export function addTooltip(svgElement: SVGGraphicsElement) {
  const mouseOffset = [10, 10];

  const foreignObject = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'foreignObject',
  );
  foreignObject.setAttribute('width', '100%');
  foreignObject.setAttribute('height', '100%');
  foreignObject.setAttribute('pointer-events', 'none');

  const tooltip = document.createElementNS(
    'http://www.w3.org/1999/xhtml',
    'div',
  );
  styleTooltip(tooltip);
  foreignObject.appendChild(tooltip);
  svgElement.append(foreignObject);

  function update(text: string, x: number, y: number) {
    let posX = x + mouseOffset[0];
    let posY = y + mouseOffset[1];

    tooltip.textContent = text;
    const svgBox = svgElement.getBBox();
    const tooltipBox = tooltip.getBoundingClientRect();

    // if text goes off the SVG edge, move up and/or left
    if (posX > svgBox.width - tooltipBox.width) {
      posX = x - tooltipBox.width - mouseOffset[0];
    }
    if (posY > svgBox.height - tooltipBox.height) {
      posY = y - tooltipBox.height - mouseOffset[1];
    }

    tooltip.style.transform = `translate(${posX}px,${posY}px)`;
  }

  function show() {
    tooltip.style.opacity = '1';
  }

  function hide() {
    tooltip.style.opacity = '0';
  }

  const remove = () => {
    svgElement.removeChild(foreignObject);
  };

  return { update, show, hide, remove };
}
