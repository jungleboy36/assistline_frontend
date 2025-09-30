import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';


export interface Proposition {
  id: number;
  retour: number;
  user_pro?: number;
  civility?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  volume_propose: number;
  biens: string;
  periode_souhaitee_start: string;
  periode_souhaitee_end: string;
  flexibilite: boolean;
  adresse_chargement: string;
  etage_chargement: number;
  passage_chargement: 'ASC' | 'ESC';
  adresse_livraison: string;
  etage_livraison: number;
  passage_livraison: 'ASC' | 'ESC';
  statut: 'EN_COURS' | 'REFUSEE' | 'CLOTUREE';
  code_confidentiel?: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class PropositionService {
  private baseUrl = `${environment.apiUrl}/propositions/`;

  constructor(private http: HttpClient) {}

  /** CREATE a new proposition */
  createProposal(payload: any): Observable<Proposition> {
    return this.http.post<Proposition>(
      this.baseUrl,
      payload,
      { withCredentials: true }
    );
  }

  /** LIST all propositions for a given retour (if retourId supplied) */
  listProposals(retourId?: number): Observable<Proposition[]> {
    let url = this.baseUrl;
    if (retourId != null) {
      url += `?retour=${retourId}`;
    }
    return this.http.get<Proposition[]>(url, { withCredentials: true });
  }

  /** GET one by ID */
  getProposal(id: number): Observable<Proposition> {
    return this.http.get<Proposition>(
      `${this.baseUrl}${id}/`,
      { withCredentials: true }
    );
  }

  /** UPDATE (partial) */
  updateProposal(id: number, payload: Partial<Proposition>): Observable<Proposition> {
    return this.http.patch<Proposition>(
      `${this.baseUrl}${id}/`,
      payload,
      { withCredentials: true }
    );
  }

  /** DELETE */
  deleteProposal(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}${id}/`,
      { withCredentials: true }
    );
  }

  /** Custom: change status (REFUSEE or CLOTUREE) */
  changeStatut(id: number, newStatut: 'REFUSEE' | 'CLOTUREE'): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}${id}/changer-statut/`,
      { statut: newStatut },
      { withCredentials: true }
    );
  }

  /** Custom: execute prestation (generate code_confidentiel) */
  executeProposal(id: number): Observable<{ code_confidentiel: string }> {
    return this.http.post<{ code_confidentiel: string }>(
      `${this.baseUrl}${id}/executer/`,
      {},
      { withCredentials: true }
    );
  }
}