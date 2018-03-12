import { Component, Input, EventEmitter, Output, AfterViewInit, NgZone, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';

@Component({
    selector: 'ngx-doc-viewer',
    template: `<iframe id="iframe" *ngIf="fullUrl" [style]="style" frameBorder="0" [src]="fullUrl"></iframe> `
})
export class NgxDocViewerComponent implements OnInit, AfterViewInit {

    public fullUrl: SafeResourceUrl;
    private configuredViewer = "google";

    constructor(private domSanitizer: DomSanitizer, private ngZone: NgZone) { }

    @Input() url: string;
    @Input() style: string = 'height:50vh;width:100%';
    @Input() set viewer(viewer: string) {
        const v = viewer.toLowerCase();
        if (v !== 'google' && v !== 'office') {
            console.error(`Unsupported viewer: '${viewer}'. Supported viewers: google, office`);
        };
        this.viewer = viewer
    }

    ngOnInit(): void {
        const u = this.url.indexOf('/')? encodeURIComponent(this.url) : this.url;
        this.fullUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(this.viewer === 'google' ? 
            `http://docs.google.com/gview?url=${u}&embedded=true`:
            `https://view.officeapps.live.com/op/embed.aspx?src=URLEncode(${u})`);
    }

    ngAfterViewInit(): void {
        // see: https://stackoverflow.com/questions/40414039/google-docs-viewer-returning-204-responses-no-longer-working-alternatives
        // hack to reload iframe if it's not loaded.
        // would maybe be better to use view.officeapps.live.com but seems not to work with sas token.
        if (this.viewer === "google") {
            this.ngZone.runOutsideAngular(() => {
                let iFrameInHtml = false;
                const timerId = setInterval(() => {
                    iFrameInHtml = !!document.querySelector('iframe');
                    if (iFrameInHtml) {
                        clearInterval(timerId);
                        this.checkIFrame();
                    }
                }, 200);
            });
        }
    }

    checkIFrame() {
        const iframe = document.querySelector('iframe');
        const timerId = setInterval(() => this.reloadIFrame(iframe), 2000);
        if (iframe) {
            iframe.onload = () => clearInterval(timerId);
        }
    }

    reloadIFrame(iframe: HTMLIFrameElement) {
        if (iframe) {
            console.log('reloading..');
            iframe.src = iframe.src;
        }
    }
}