import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'ngx-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent {

  @Input() title: string;
  @Input() type: string;
  @Input() on = true;
  @Input() price: string;

}
