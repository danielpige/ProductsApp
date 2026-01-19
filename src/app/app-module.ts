import { ErrorHandler, NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { HttpErrorInterceptor } from './core/http/http-error.interceptor';
import { GlobalErrorHandler } from './core/errors/global-error.handler';
import { ToastComponent } from './core/ui/toast/toast.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { API_BASE_URL } from './core/config/environment.token';
import { environment } from '../environments/environment';
import { PRODUCT_REPOSITORY } from './tokens/products.tokens';
import { ProductHttpRepository } from './data-access/products/repositories/product-http.repository';

@NgModule({
  declarations: [App, ToastComponent],
  imports: [BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: PRODUCT_REPOSITORY, useClass: ProductHttpRepository },
  ],
  bootstrap: [App],
})
export class AppModule {}
