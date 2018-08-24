import { fromEvent, interval, from, iif, of } from 'rxjs';
import {
    take,
    map,
    concatAll,
    takeUntil,
    concat,
    startWith,
    merge,
    filter,
    withLatestFrom,
    delay,
    zip,
    retry,
    catchError,
    retryWhen,
    debounceTime,
    switchMap,
    concatMap,
    toArray,
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
            return {
                x: validValue(move.clientX - down.offsetX, ex4Div.offsetWidth - 200, 0),
                y: validValue(move.clientY - down.offsetY, ex4Div.offsetTop + ex4Div.offsetHeight - 140, ex4Div.offsetTop)
            }
        })
    )
        .subscribe(pos => {
            ex4Img.style.top = `${pos.y}px`;
            ex4Img.style.left = `${pos.x}px`;
        })

    // example 5 

    const ex5From = from(['a', 'b', 'c', 'd', 666])
    const ex5Inteval = interval(700);

    ex5From.pipe(
        zip(ex5Inteval, (x, y) => ({x, y})),
        map(obj => obj.x.toUpperCase()),
        retry(2),
        // other operators to handle error
        // catchError((err, obs) => obs),
        // retryWhen(errorObs => errorObs.pipe(delay(1000)))
    )
        .subscribe({
            next: (result) => console.log(result),
            error: (err) => console.log('Error: ', err),
            complete: () => console.log(complete)
        });

    // example 6

    const ex6Div = document.querySelector('#example6');
    const ex6Imgs = document.querySelectorAll('#example6 img');

    const ex6MouseMove$ = fromEvent(ex6Div, 'mousemove');

    ex6Imgs.forEach((item, i) => {
        ex6MouseMove$.pipe(
            map(e => ({ x: e.clientX - 25, y: e.clientY - ex6Div.offsetTop + 300 })),
            delay(300 * (Math.pow(0.65, i) + Math.cos(i / 4)) / 2)
        )
            .subscribe((pos) => {
                item.style.transform = 'translate3d(' + pos.x + 'px, ' + pos.y + 'px, 0)';
            });
    });

    // example 7

    const ex7Input = document.querySelector('#example7 .search');
    const ex7List = document.querySelector('#example7 ul');

    const apiUrl = 'https://api.coinmarketcap.com/v2/ticker/';
    const getData = () => fetch(apiUrl).then(res => res.json());
    const render = (resultArr = []) => ex7List.innerHTML = resultArr.map(item => '<li>'+ item +'</li>').join('')

    const ex7KeyUp$ = fromEvent(ex7Input, 'keyup');
    const ex7Request$ = from(getData());
    const ex7Select$ = fromEvent(ex7List, 'click');

    ex7KeyUp$.pipe(
        debounceTime(500),
        switchMap(() => ex7Request$, (e, res) => [e.target.value, res.data]),
        concatMap(
            ([value, obj]) => (
                iif(
                    // statement
                    () => value.length < 1,
                    // if true
                    of('').pipe(
                        map(() => [])
                    ),
                    // if false
                    from(Object.keys(obj)).pipe(
                        map(key => obj[key].name),
                        filter(name => new RegExp(value.toLowerCase()).test(name.toLowerCase())),
                        toArray(),
                    )
                )
            )
        )
    )
        .subscribe(list => {
            render(list);
        });

    ex7Select$.pipe(
        filter(e => e.target.matches('li')),
        map(e => e.target.innerText)
    )
        .subscribe((val) => {
            ex7Input.value = val;
            render();
        })
});
