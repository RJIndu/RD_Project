import { Component, OnInit } from '@angular/core';

interface ProductListSettings {
  title: string;
  iconClass: string;
  type: string;
  quantity:Number;
}

@Component({
  selector: 'ngx-shoppingcart',
  templateUrl: './shoppingcart.component.html',
  styleUrls: ['./shoppingcart.component.scss']
})
export class ShoppingcartComponent implements OnInit {

  
  secondCard = {
    news: [],
    placeholders: [],
    loading: false,
    pageToLoadNext: 1,
  };
  pageSize = 10;

   constructor() {}

  loadNext(cardData) {
    if (cardData.loading) { return; }

    cardData.loading = true;
    cardData.placeholders = new Array(this.pageSize);
    let nextNews=[{}];
    // this.newsService.load(cardData.pageToLoadNext, this.pageSize)
      // .subscribe(nextNews => {
        cardData.placeholders = [];
        cardData.news.push(...nextNews);
        cardData.loading = false;
        cardData.pageToLoadNext++;
      // });
  }

  ngOnInit() {
  }

}
