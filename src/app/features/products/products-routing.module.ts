import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductList } from './pages/product-list/product-list';
import { ProductForm } from './pages/product-form/product-form';

const routes: Routes = [
  { path: '', component: ProductList },
  { path: 'new', component: ProductForm },
  { path: ':id/edit', component: ProductForm },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductsRoutingModule {}
