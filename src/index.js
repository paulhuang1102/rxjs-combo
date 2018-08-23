import { fromEvent, interval } from 'rxjs';
import {
    take, map, concatAll, takeUntil, concat, startWith, merge, filter, withLatestFrom, delay
 } from 'rxjs/operators';

document.addEventListener('DOMContentLoaded', () => {

    // example 1
    const ex1Click$ = fromEvent(document.querySelector('#example1 button'), 'click');
    const ex1Interval$ = interval(500)
        .pipe(
            take(3)
        );

    ex1Click$.pipe(
        map(event => ex1Interval$),
        concatAll()
    )
        .subscribe(
            {
                next: (v) => { console.log(v); },
                error: (err) => { console.log('Error', err); },
                complete: () => { console.log('cmplete'); }
            }
        )

    // example 2
    const ex2Holder = document.querySelector('#example2');
    const ex2Drag = document.querySelector('#example2 .drag');

    const ex2MouseDown$ = fromEvent(ex2Drag, 'mousedown');
    const ex2MouseMove$ = fromEvent(ex2Holder, 'mousemove');
    const ex2MouseUp = fromEvent(ex2Holder, 'mouseup');

    ex2MouseDown$.pipe(
        map(e => ex2MouseMove$
            .pipe(
                takeUntil(ex2MouseUp),
            )
        ),
        concatAll(),
        map(e => ({ x: e.clientX, y: e.clientY }))
    )
        .subscribe(({ x, y }) => {
            ex2Drag.style.left = `${x - ex2Drag.offsetWidth / 2}px`;
            ex2Drag.style.top = `${y - (ex2Holder.offsetTop) - 30}px`;
        });
    
    // example 3
    const concatBtn = document.querySelector('#example3 button:first-child');
    const mergeBtn = document.querySelector('#example3 button:last-child');
    
    const ex3Click1$ = fromEvent(concatBtn, 'click');
    const ex3Click2$ = fromEvent(mergeBtn, 'click');
    
    const ex3Interval1$ = interval(500).pipe(take(3));
    const ex3Interval2$ = interval(500).pipe(startWith('second obs start'), take(3));

    ex3Click1$.pipe(
        map(e => ex3Interval1$
                .pipe(
                    concat(ex3Interval2$),
                )
        ),
        concatAll()
    )
        .subscribe((v) => {
            console.log(`this is concat order: ${v}`);
        });

    ex3Click2$.pipe(
        map(e => ex3Interval1$
                .pipe(
                    merge(ex3Interval2$),
                )
        ),
        concatAll()
    )
        .subscribe((v) => {
            console.log(`this is merge order: ${v}`);
        })
    

    // example 4
    const ex4Div = document.querySelector('#example4');
    const ex4Img = document.querySelector('#example4 .img');
    const ex4Anchor = document.querySelector('#example4 .anchor');

    const ex4Scroll$ = fromEvent(ex4Div, 'scroll');
    const ex4MouseDown$ = fromEvent(ex4Img, 'mousedown');
    const ex4MouseMove$ = fromEvent(ex4Div, 'mousemove');
    const ex4MouseUp$ = fromEvent(document, 'mouseup');

    const validValue = (value, max, min) => Math.min(Math.max(value, min), max);

    ex4Scroll$.pipe(
            map(e => ex4Anchor.getBoundingClientRect().bottom < 178)
        )
        .subscribe(bool => {
            if (bool) {
                ex4Img.classList.add('pos-fixed');
            }
            else {
                ex4Img.classList.remove('pos-fixed');
            }
        });

    ex4MouseDown$.pipe(
        filter(e => e.currentTarget.classList.contains('pos-fixed')),
        map(e => ex4MouseMove$
                .pipe(
                    takeUntil(ex4MouseUp$)
                )
        ),
        concatAll(),
        // ex4MouseMove$, ex4MouseDown$ final vlaue will be parameter
        withLatestFrom(ex4MouseDown$, (move, down) => {
            console.log(move.clientX, move.clientY, down);
            return {
                x: validValue(move.clientX - down.offsetX, ex4Div.offsetWidth - 200, 0),
                y: validValue(move.clientY - down.offsetY, ex4Div.offsetTop + ex4Div.offsetHeight - 140, ex4Div.offsetTop)
            }
        })
    )
        .subscribe(pos => {
            console.log(pos);
            ex4Img.style.top = `${pos.y}px`;
            ex4Img.style.left = `${pos.x}px`;
        })

    // example 5
    const ex5Div = document.querySelector('#example5');
    const ex5Imgs = document.querySelectorAll('#example5 img');

    const ex5MouseMove$ = fromEvent(ex5Div, 'mousemove');

    ex5Imgs.forEach((item, i) => {
        ex5MouseMove$.pipe(
            map(e => ({ x: e.clientX, y: e.clientY })),
            delay(300 * (Math.pow(0.65, i) + Math.cos(i / 4)) / 2)
        )
            .subscribe((pos) => {
                console.log(pos);
                item.style.top = pos.y + 75 + 'px';
                item.style.left = pos.x - 25 + 'px';
            });
    });

});
