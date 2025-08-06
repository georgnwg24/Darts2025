import { AfterViewInit, Component, ElementRef, EventEmitter, HostBinding, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-dartboard',
  imports: [],
  templateUrl: './dartboard.component.html',
  styleUrl: './dartboard.component.css',
  encapsulation: ViewEncapsulation.None 
})
export class DartboardComponent implements AfterViewInit {
  @Input() isActive: boolean = true;
  @Output() throwRecorded = new EventEmitter<number>();
  @Output() continue = new EventEmitter<void>();
  @Output() rollback = new EventEmitter<void>();
  
  @ViewChild('dartboard', { static: true }) dartboardRef!: ElementRef<SVGElement>;

  @HostBinding('class.inactive') get inactiveClass() {
    return !this.isActive;
  }

  ngAfterViewInit(): void {
    this.renderDartboard();
  }

  private renderDartboard(): void {
    const dartboard = this.dartboardRef.nativeElement;
    
    // Dartboard configuration
    const centerX = 250;
    const centerY = 250;
    const outerRadius = 500;
    const sectionCount = 20;
    const sectionAngle = 360 / sectionCount;
    
    // Define radii for different board sections
    const radii = {
      doubleRingInner: outerRadius * 0.9,
      doubleRingOuter: outerRadius,
      tripleRingInner: outerRadius * 0.5,
      tripleRingOuter: outerRadius * 0.6,
      singleAreaInner: outerRadius * 0.6,
      singleAreaOuter: outerRadius * 0.9,
      innerBull: outerRadius * 0.065,
      outerBull: outerRadius * 0.12,
      background: outerRadius * 1.2,
      numbers: outerRadius * 1.1
    };
    
    // Dartboard values in clockwise order starting from top
    const values = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
    
    // Colors for the dartboard
    const colors = {
      bg: '#000',            // Black background
      singleEven: '#000',    // Black
      singleOdd: '#d1c69b',  // Beige
      multEven: '#a60008',   // Dark red
      multOdd: '#006917',    // Green
      text: '#d6d6d6',       // Light gray
      stroke: '#000'         // Black stroke
    };
    
    // Create background circle
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', centerX.toString());
    bgCircle.setAttribute('cy', centerY.toString());
    bgCircle.setAttribute('r', radii.background.toString());
    bgCircle.setAttribute('fill', colors.bg);

    bgCircle.addEventListener('click', () => {
      if (this.isActive) {
        this.throwRecorded.emit(0);
      }
    });
    bgCircle.classList.add('dart-section');

    dartboard.appendChild(bgCircle);
    
    // Create the double ring (outer ring)
    for (let i = 0; i < sectionCount; i++) {
      const startAngle = (i + 0.5) * sectionAngle;
      const endAngle = (i + 1.5) * sectionAngle;
      const value = values[(i + 1) % sectionCount];
      
      const isEven = i % 2 === 0;
      const fillColor = isEven ? colors.multOdd : colors.multEven;
      
      const path = this.createWedgePath(
        centerX, centerY,
        radii.doubleRingInner, radii.doubleRingOuter,
        startAngle, endAngle
      );
      
      const wedge = this.createWedge(path, fillColor, `double-${value}`, value, 2);
      dartboard.appendChild(wedge);
    }
    
    // Create outer single area (between double ring and triple ring)
    for (let i = 0; i < sectionCount; i++) {
      const startAngle = (i + 0.5) * sectionAngle;
      const endAngle = (i + 1.5) * sectionAngle;
      const value = values[(i + 1) % sectionCount];
      
      const isEven = i % 2 === 0;
      const fillColor = isEven ? colors.singleOdd : colors.singleEven;
      
      const path = this.createWedgePath(
        centerX, centerY,
        radii.singleAreaInner, radii.singleAreaOuter,
        startAngle, endAngle
      );
      
      const wedge = this.createWedge(path, fillColor, `single-${value}`, value, 1);
      dartboard.appendChild(wedge);
    }
    
    // Create the triple ring (inner ring)
    for (let i = 0; i < sectionCount; i++) {
      const startAngle = (i + 0.5) * sectionAngle;
      const endAngle = (i + 1.5) * sectionAngle;
      const value = values[(i + 1) % sectionCount];
      
      const isEven = i % 2 === 0;
      const fillColor = isEven ? colors.multOdd : colors.multEven;
      
      const path = this.createWedgePath(
        centerX, centerY,
        radii.tripleRingInner, radii.tripleRingOuter,
        startAngle, endAngle
      );
      
      const wedge = this.createWedge(path, fillColor, `triple-${value}`, value, 3);
      dartboard.appendChild(wedge);
    }
    
    // Create inner single area (between triple ring and bullseye)
    for (let i = 0; i < sectionCount; i++) {
      const startAngle = (i + 0.5) * sectionAngle;
      const endAngle = (i + 1.5) * sectionAngle;
      const value = values[(i + 1) % sectionCount];
      
      const isEven = i % 2 === 0;
      const fillColor = isEven ? colors.singleOdd : colors.singleEven;
      
      const path = this.createWedgePath(
        centerX, centerY,
        radii.outerBull, radii.tripleRingInner,
        startAngle, endAngle
      );
      
      const wedge = this.createWedge(path, fillColor, `inner-single-${value}`, value, 1);
      dartboard.appendChild(wedge);
    }
    
    // Create bullseyes
    const outerBull = this.createCircle(centerX, centerY, radii.outerBull, colors.multOdd, 'outer-bull', 25, 1);
    dartboard.appendChild(outerBull);
    
    const innerBull = this.createCircle(centerX, centerY, radii.innerBull, colors.multEven, 'inner-bull', 50, 1);
    dartboard.appendChild(innerBull);
    
    // Add value labels
    for (let i = 0; i < sectionCount; i++) {
      const angle = (i * sectionAngle) * Math.PI / 180;
      const distance = radii.numbers;
      const x = centerX + Math.sin(angle) * distance;
      const y = centerY - Math.cos(angle) * distance;
      const value = values[i];
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x.toString());
      text.setAttribute('y', y.toString());
      text.setAttribute('font-size', '54');              
      text.setAttribute('class', 'value-label');
      text.textContent = value.toString();
      
      dartboard.appendChild(text);
    }
  }

  // Helper function to create a wedge path
  private createWedgePath(cx: number, cy: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number): string {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = cx + outerRadius * Math.cos(startRad);
    const y1 = cy + outerRadius * Math.sin(startRad);
    
    const x2 = cx + outerRadius * Math.cos(endRad);
    const y2 = cy + outerRadius * Math.sin(endRad);
    
    const x3 = cx + innerRadius * Math.cos(endRad);
    const y3 = cy + innerRadius * Math.sin(endRad);
    
    const x4 = cx + innerRadius * Math.cos(startRad);
    const y4 = cy + innerRadius * Math.sin(startRad);
    
    const largeArc = (endAngle - startAngle > 180) ? 1 : 0;
    
    return `M ${x1} ${y1} 
            A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} 
            L ${x3} ${y3} 
            A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} 
            Z`;
  }
  
  // Helper function to create a wedge element
  private createWedge(path: string, fillColor: string, id: string, baseValue: number, multiplier: number): SVGPathElement {
    const wedge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    wedge.setAttribute('d', path);
    wedge.setAttribute('fill', fillColor);
    wedge.setAttribute('class', 'dart-section');
    wedge.setAttribute('data-base', baseValue.toString());
    wedge.setAttribute('data-multiplier', multiplier.toString());
    
    wedge.addEventListener('click', () => {
      const baseAttr = wedge.getAttribute('data-base');
      if (baseAttr === null) {
        throw new Error('Throw was null');
      }
      const multiplierAttr = wedge.getAttribute('data-multiplier');
      if (multiplierAttr === null) {
        throw new Error('Throw was null');
      }
      const base = parseInt(baseAttr, 10);
      const multiplier = parseInt(multiplierAttr, 10);
      // Handle score here (e.g., emit event or call service)
      console.log(base*multiplier);

      const score = base * multiplier; // Calculate the score
      this.throwRecorded.emit(score); // Emit the score
    });
    
    return wedge;
  }
  
  // Helper function to create a circle
  private createCircle(cx: number, cy: number, r: number, fillColor: string, id: string, baseValue: number, multiplier: number): SVGCircleElement {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx.toString());
    circle.setAttribute('cy', cy.toString());
    circle.setAttribute('r', r.toString());
    circle.setAttribute('fill', fillColor);
    circle.setAttribute('class', 'dart-section');
    circle.setAttribute('data-base', baseValue.toString());
    circle.setAttribute('data-multiplier', multiplier.toString());
    
    circle.addEventListener('click', () => {
      const baseAttr = circle.getAttribute('data-base');
      if (baseAttr === null) {
        throw new Error('Throw was null');
      }
      const multiplierAttr = circle.getAttribute('data-multiplier');
      if (multiplierAttr === null) {
        throw new Error('Throw was null');
      }
      const base = parseInt(baseAttr, 10);
      const multiplier = parseInt(multiplierAttr, 10);
      // Handle score here (e.g., emit event or call service)
      console.log(base*multiplier);

      const score = base * multiplier; // Calculate the score
      this.throwRecorded.emit(score); // Emit the score
    });
    
    return circle;
  }
}
