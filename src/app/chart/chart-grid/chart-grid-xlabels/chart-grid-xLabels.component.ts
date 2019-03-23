import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { SortedX } from '../../../app.component';
import { Settings } from '../../chart.component';
import { ChartEventsService, VisibleFrameObj } from '../../chart-events.service';

interface XLabelsObj {
  value: string | number;
  x: number;
  y: number;
  opacity: string;
  fontSize: number;
  fill: string;
}

interface BeforeLoopCalcObj {
  chartWidth: number;
  yPoint: number;
  xLabelsCount: number;
  visiblePointsArr: number[];
  visibleValuesPiece: number;
  visibleValuesMiddlePiece: number;
  visiblePointsPiece: number;
  visiblePointsMiddlePiece: number;
}

interface LoopCalcObj {
  value: number;
  xPoint: number;
  yPoint: number;
}

@Component({
  selector: '[app-chart-grid-xLabels]',
  templateUrl: './chart-grid-xLabels.component.html',
  styleUrls: ['./chart-grid-xLabels.component.scss']
})
export class ChartGridXLabelsComponent implements OnInit, OnDestroy {
  @Input() settings: Settings;
  @Input() xData: SortedX;
  
  
  private xLabelsArr: XLabelsObj[];
  private sub1: Subscription;


  constructor(private chartEventsService: ChartEventsService) {
    this.sub1 = this.chartEventsService
      .visibleFrame
      .subscribe((visibleFrame: VisibleFrameObj) => {
      if (this.xLabelsArr && this.xLabelsArr.length > 0) {
        this.updateLabels(visibleFrame);
      }
    });
  }


  ngOnInit() {
    this.xLabelsArr = this.buildLabels({
      from: 0,
      to: this.settings._xLen * this.settings._initRatioPercent
    });
  }
  
  ngOnDestroy() {
    this.sub1.unsubscribe();
  }

  private buildLabels(visibleFrame: VisibleFrameObj): XLabelsObj[] {
    const beforeLoopCalcObj: BeforeLoopCalcObj = this.beforeLoopCalc(visibleFrame);
  
    const xLabelsArr = [];
    for (let xDataIndex = 0; xDataIndex < beforeLoopCalcObj.xLabelsCount; xDataIndex++) {
      const loopCalcObj: LoopCalcObj = this.loopCalc(beforeLoopCalcObj, xDataIndex);
  
      xLabelsArr.push({
        value: loopCalcObj.value,
        x: loopCalcObj.xPoint,
        y: loopCalcObj.yPoint,
        opacity: '1',
        fontSize: this.settings.grid.fontSize,
        fill: 'black',
      });
    }
  
    return xLabelsArr;
  }
  
  private updateLabels(visibleFrame: VisibleFrameObj) {
    const beforeLoopCalcObj: BeforeLoopCalcObj = this.beforeLoopCalc(visibleFrame);

    const xLabelsArrLen = this.xLabelsArr.length;
    for (let xLabelsArrIdx = 0; xLabelsArrIdx < xLabelsArrLen; xLabelsArrIdx++) {
      const curXLabel = this.xLabelsArr[xLabelsArrIdx];

      const loopCalcObj: LoopCalcObj = this.loopCalc(beforeLoopCalcObj, xLabelsArrIdx);

      if (curXLabel.value !== loopCalcObj.value) {
        curXLabel.value = loopCalcObj.value;
        curXLabel.x = loopCalcObj.xPoint;
      }
    }
  }
  
  private beforeLoopCalc(visibleFrame: VisibleFrameObj): BeforeLoopCalcObj {
    // one char width
    const chartWidth = this.settings.grid.fontSize / 2;
  
  
    // calculate y point position
    const yPoint = this.settings.main.height - (this.settings.main.paddingBot / 2);
    
    
    // left right padding (in chars)
    const xLabelsPadding = chartWidth * 6;
    
    
    // calculate visible values count
    // according to value width + padding
    let xLabelsCount = window.innerWidth / (this.xData.maxValLength * chartWidth + xLabelsPadding);
    xLabelsCount = Math.floor(xLabelsCount);
    
    
    // get values according to visibleFrame
    const visiblePointsArr: number[] = this.xData.data.slice(visibleFrame.from, visibleFrame.to);
  
  
    // distribute values according to visiblePointsArr
    const visibleValuesPiece = Math.floor(visiblePointsArr.length / xLabelsCount);
    // middle of one value piece
    const visibleValuesMiddlePiece = Math.floor(visiblePointsArr.length / xLabelsCount / 2);
    
    
    // distribute x points according to window.innerWidth
    const visiblePointsPiece = Math.floor(window.innerWidth / xLabelsCount);
    // middle of one x points
    const visiblePointsMiddlePiece = Math.floor(window.innerWidth / xLabelsCount / 2);
    
    return {
      chartWidth,
      yPoint,
      xLabelsCount,
      visiblePointsArr,
      visibleValuesPiece,
      visibleValuesMiddlePiece,
      visiblePointsPiece,
      visiblePointsMiddlePiece
    };
  }
  
  private loopCalc(beforeLoopCalcObj: BeforeLoopCalcObj, index: number): LoopCalcObj {
    const {
      chartWidth,
      yPoint,
      visiblePointsArr,
      visibleValuesPiece,
      visibleValuesMiddlePiece,
      visiblePointsPiece,
      visiblePointsMiddlePiece
    } = beforeLoopCalcObj;
    
    // get middle index of each piece
    const pointValueIdx = visibleValuesPiece * (index + 1) - visibleValuesMiddlePiece;
    
    // get value
    const value = visiblePointsArr[pointValueIdx]  ? visiblePointsArr[pointValueIdx].toString() : '0';
    // get value width
    const valueWidth = Math.round(value.length * chartWidth);
  
    // get middle point of each piece
    let xPoint = visiblePointsPiece * (index + 1) - visiblePointsMiddlePiece;
    // and set it in the middle of the value
    xPoint -= valueWidth / 2;
    
    return {
      value: Number(value),
      xPoint,
      yPoint,
    };
  }
}
