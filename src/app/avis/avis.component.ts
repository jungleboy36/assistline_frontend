import { Component, OnInit } from '@angular/core';
import { AvisService } from '../services/avis.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-avis',
  templateUrl: './avis.component.html',
  styleUrls: []
})
export class AvisComponent implements OnInit {
feedbacks : any[] = [];
comment :string ='';
constructor(private avisService : AvisService){}

ngOnInit(): void {
    this.getRports();


  
}



getRports(){

  this.avisService.getReports().subscribe(
    response => {
      console.log(response)
      this.feedbacks = response;
    },
    error => {
      console.log(error)
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: 'Échec de récupération des avis'
    });
    }
  )
}

selectFeedback(f : string){
  this.comment = f;
}

deleteReport(feedback : any){
  if(window
    .confirm('Voulez-vous vraiment supprimer cet avis ?')
  ){
  this.avisService.deleteReport(feedback.id) 
  .subscribe(
    response => {
      this.feedbacks = this.feedbacks.filter(f => f.id !== feedback.id);
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Avis supprimé avec succès'
      });
    },
    error => {
      console.log(error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Échec de suppression de l\'avis'
      });
    }
  );
}}
}
