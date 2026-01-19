import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ProductsRoutingModule } from './products-routing.module';
import { ProductList } from './pages/product-list/product-list';
import { ProductForm } from './pages/product-form/product-form';
import { SkeletonComponent } from '../../core/ui/skeleton/skeleton.component';
import { ConfirmModalComponent } from '../../core/ui/confirm-modal/confirm-modal.component';
import { ProductListView } from './pages/product-list/product-list-view/product-list-view';
import { ProductRowActions } from './pages/product-list/product-list-view/product-row-actions/product-row-actions';

@NgModule({
  declarations: [
    ProductList,
    ProductForm,
    SkeletonComponent,
    ConfirmModalComponent,
    ProductListView,
    ProductRowActions,
  ],
  imports: [CommonModule, ReactiveFormsModule, ProductsRoutingModule],
})
export class ProductsModule {}
