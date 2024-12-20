import { Component, OnInit, Inject } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ServicesManageService } from 'src/app/services/servicesManagement/services-manage.service';

@Component({
  selector: 'app-booking-dialog',
  templateUrl: './booking-dialog.component.html',
  styleUrls: ['./booking-dialog.component.scss'],
})
export class BookingDialogComponent implements OnInit {
  room: any; // The room data
  dateFrom!: Date;  // Start date passed from RoomBookingComponent
  dateTo!: Date;
  services: any[] = []; // Available services
  selectedServices: any[] = []; // Selected services
  totalPrice: number = 0; // Total price for the booking
  isVisible: boolean = false; // Dialog visibility
  selectedServicesMap: Map<string, boolean> = new Map();
  totalDays!: number;

  constructor(
    private servicesService: ServicesManageService,
    private ref: DynamicDialogRef,
    @Inject(DynamicDialogConfig) private config: DynamicDialogConfig
  ) {}

  ngOnInit(): void {
    // Initialize room data
    const { room, dateFrom, dateTo } = this.config.data;
    this.room = room;
    this.dateFrom = new Date(dateFrom); // Ensure the dates are Date objects
    this.dateTo = new Date(dateTo);
    // Fetch services from the service manager
    this.fetchServices();
    this.calculateTotalDays(); // Calculate the days on init
  }

  fetchServices(): void {
    this.servicesService.getAllServices().subscribe(
      (data) => {
        this.services = data.map((service: any) => ({
          ...service,
          selected: false,
        })); // Ensure selected is set to false
      },
      (error) => {
        console.error('Error fetching services', error);
      }
    );
  }

  calculateTotalDays(): void {
    if (this.dateFrom && this.dateTo) {
      // Get the time difference in milliseconds
      const timeDifference = this.dateTo.getTime() - this.dateFrom.getTime();

      // If the time difference is negative, set days to 0 or handle as needed
      if (timeDifference < 0) {
        console.error('End date must be after the start date');
        this.totalDays = 0;
      } else {
        // Calculate the number of days
        this.totalDays = Math.ceil(timeDifference / (1000 * 3600 * 24)); // Round up to account for partial days
      }
    } else {
      console.error('Invalid dates');
      this.totalDays = 0;
    }
  }

  updatePrice(service: any): void {
    // Get current state
    const wasSelected = this.selectedServicesMap.get(service.nomService);

    // Update state to new value (opposite of what it was)
    this.selectedServicesMap.set(service.nomService, !wasSelected);

    // Update selected services list
    if (!wasSelected) {
      this.selectedServices.push(service);
    } else {
      this.selectedServices = this.selectedServices.filter(
        (s) => s.nomService !== service.nomService
      );
    }

    // Recalculate total price after selecting a service
    this.calculateTotalDays(); // Ensure days are recalculated
    if (this.totalDays > 0) {
      // Calculate total price including room price and selected services
      this.totalPrice =
        (this.room.prix * this.totalDays) + // Multiply room price by the number of days
        this.selectedServices.reduce((sum, s) => sum + s.prix, 0); // Add price of selected services
    }

    console.log('Updated Total Price:', this.totalPrice);  // For debugging
  }

  closeDialog() {
    this.ref.close();
  }
}
