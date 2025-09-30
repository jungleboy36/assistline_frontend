import { Component, Input, OnInit } from '@angular/core';
import { MapService } from '../services/map.service';
import * as $ from 'jquery';
@Component({
  selector: 'app-france-map',
  templateUrl: './france-map.component.html',
  styleUrls: ['./france-map.component.css']
})
export class FranceMapComponent implements OnInit {
  selectedRegions$ = this.mapService.selectedRegions$;
  displayRegions$ = this.mapService.displayRegions$;
  @Input() modalType!: string; 
  @Input() compact: boolean = false;
  @Input() id :any;
  @Input() route : any;
  constructor(private mapService: MapService) {}

  ngOnInit(): void {
    if(this.compact){ 
       this.liste();}
  
  }

  regionClicked(event: MouseEvent): void {
    const target = event.target as SVGElement;
    if(this.modalType === 'update') {
      if (target.classList.contains('land')) {
        this.mapService.selectRegion3(target.id);
      }
    }
    else if(this.modalType === 'add') { {
      this.mapService.selectRegion(target.id);
    }}
    else{
      this.mapService.selectRegionFilter(target.id);
    }
  }

  resetMap(c  :String): void {
    this.mapService.resetMap(c);
  }

  liste(): void {
  const departmentIds = this.route.split(',').map(String);
  console.log("departments for"+ this.id + " : " + departmentIds);

  departmentIds.forEach((deptId: { toString: () => string; }, index: number) => {
    const element = $("#route"+this.id).find("#" + deptId.toString());
    $("#route"+this.id).find("#" + deptId.toString()).addClass("selected");
    console.log("element length : " + element.length);
    if (element.length > 0) {
        element.addClass("selected");}

      // Set `mapLoading = false` only after the last region is selected
     
    }) // Progressive delay for each region



  
}

  
}
