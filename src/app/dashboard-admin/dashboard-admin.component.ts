import { Component } from '@angular/core';
import { AdminService } from '../services/admin.service';
import * as ApexCharts from 'apexcharts';

@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard-admin.component.html',
  styleUrls: []
})

export class DashboardAdminComponent {
  loading: boolean = true;
  public documentCount: any = {
    client: 0,
    company: 0,
    offers: 0,
    demandes: 0,
    conversations: 0,
    new_users: 0,
    reports : 0,
  };
  public paymentChartOptions: any;
  public clientCompanyChartOptions: any;
  payments: any[] = [];

  constructor(private adminService: AdminService) {
    this.adminService.dashboard().subscribe(data => {
      console.log('data:', data);

      this.documentCount.client = data.client_count;
      this.documentCount.company = data.company_count;
      this.documentCount.offers = data.offres_count;
      this.documentCount.demandes = data.demandes_count;
      this.documentCount.conversations = data.conversations_count;
      this.documentCount.new_users = data.new_users;
      this.documentCount.reports  = data.reports;
      this.payments = data.payments;

      const monthlyTotals = this.calculateMonthlyTotals(this.payments);
      this.initPaymentChart(monthlyTotals);

      const monthlyClientCompanyData = this.aggregateMonthlyClientCompanyData(data.clients, data.companies);
      this.initClientCompanyChart(monthlyClientCompanyData);

      this.loading = false;
      this.payments = this.payments
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 5);
    });
  }

  ngOnInit(): void {}

  calculateMonthlyTotals(payments: any[]): { month: string, total: number }[] {
    const monthlyTotals: { [key: string]: number } = {};

    payments.forEach(payment => {
      const paymentDate = new Date(payment.time);
      const monthYear = `${paymentDate.getMonth() + 1}-${paymentDate.getFullYear()}`;
      if (!monthlyTotals[monthYear]) {
        monthlyTotals[monthYear] = 0;
      }
      monthlyTotals[monthYear] += payment.amount;
    });

    const sortedMonths = Object.keys(monthlyTotals).sort((a, b) => {
      const [monthA, yearA] = a.split('-').map(Number);
      const [monthB, yearB] = b.split('-').map(Number);
      return new Date(yearA, monthA - 1).getTime() - new Date(yearB, monthB - 1).getTime();
    });

    return sortedMonths.map(month => ({ month, total: monthlyTotals[month] }));
  }

  aggregateMonthlyClientCompanyData(clients: any[], companies: any[]): { month: string, clients: number, companies: number }[] {
    const monthlyData: { [key: string]: { clients: number, companies: number } } = {};

    clients.forEach(client => {
      const date = new Date(client.time);
      const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { clients: 0, companies: 0 };
      }
      monthlyData[monthYear].clients += 1;
    });

    companies.forEach(company => {
      const date = new Date(company.time);
      const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { clients: 0, companies: 0 };
      }
      monthlyData[monthYear].companies += 1;
    });

    return Object.keys(monthlyData).map(month => ({
      month,
      clients: monthlyData[month].clients,
      companies: monthlyData[month].companies
    })).sort((a, b) => {
      const [monthA, yearA] = a.month.split('-').map(Number);
      const [monthB, yearB] = b.month.split('-').map(Number);
      return new Date(yearA, monthA - 1).getTime() - new Date(yearB, monthB - 1).getTime();
    });
  }

  initPaymentChart(monthlyTotals: { month: string, total: number }[]): void {
    const categories = monthlyTotals.map(mt => mt.month);
    const series = monthlyTotals.map(mt => mt.total);

    this.paymentChartOptions = {
      series: [{
        name: 'Montant total',
        data: series
      }],
      chart: {
        type: 'bar',
        height: 350
      },
      xaxis: {
        categories: categories,
        title: {
          text: 'Mois-Année'
        }
      },
      yaxis: {
        title: {
          text: 'Montant total'
        }
      },
      title: {
        text: ''
      }
    };

    const paymentChart = new ApexCharts(document.querySelector("#paymentChart"), this.paymentChartOptions);
    paymentChart.render();
  }

  initClientCompanyChart(monthlyData: { month: string, clients: number, companies: number }[]): void {
    const categories = monthlyData.map(data => data.month);
    const clientSeries = monthlyData.map(data => data.clients);
    const companySeries = monthlyData.map(data => data.companies);

    this.clientCompanyChartOptions = {
      series: [
        {
          name: 'Clients',
          data: clientSeries
        },
        {
          name: 'Sociétés',
          data: companySeries
        }
      ],
      chart: {
        type: 'bar',
        height: 350
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 10,
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: categories,
        title: {
          text: 'Mois-Annéee'
        }
      },
      yaxis: {
        title: {
          text: 'Nombre'
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: function (val :any) {
            return val;
          }
        }
      }
    };

    const clientCompanyChart = new ApexCharts(document.querySelector("#clientCompanyChart"), this.clientCompanyChartOptions);
    clientCompanyChart.render();
  }
}
