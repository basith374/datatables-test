$("#table")
	.DataTable({
        // dom: 'Bfrtip',
		buttons: [
            {
                extend: 'print',
                customize: function(win) {
                    $(win.document.body)
                        .css('font-size', '10pt');
                    $(win.document.body)
                        .find('table')
                        .addClass('compact')
                        .css('font-size', 'inherit');
                },
                footer: true
            }
		],
		ajax: {
			url: 'data.json',
			dataSrc: 'items'
		},
		columns: [
			{data: 'id'},
			{data: 'name'},
			{data: 'company'},
			{data: 'email'},
			{data: 'phone'},
			{data: 'balance'}
		],
		footerCallback: function ( row, data, start, end, display ) {
            var api = this.api(), data;
 
            // Remove the formatting to get integer data for summation
            var intVal = function ( i ) {
                return typeof i === 'string' ?
                    i.replace(/[\$,]/g, '')*1 :
                    typeof i === 'number' ?
                        i : 0;
            };
 
            // Total over all pages
            total = api
                .column( 5, { search: 'applied'} )
                .data()
                .reduce( function (a, b) {
                    return intVal(a) + intVal(b);
                }, 0 );
 
            // Total over this page
            pageTotal = api
                .column( 5, { page: 'current'} )
                .data()
                .reduce( function (a, b) {
                    return intVal(a) + intVal(b);
                }, 0 );
 
            // Update footer
            $( api.column( 5 ).footer() ).html(
                '$'+pageTotal +' ( $'+ total +' total )'
            );
        }
	});

function escapeRegExp(string){
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

new Vue({
    data: {
        items: [],
        curPage: 1,
        limit: 10,
        search: ''
    },
    computed: {
        totalPages: function() {
            return Math.ceil(this.filteredItems.length / this.limit);
        },
        curPageItems: function() {
            var startIndex = this.curPage / this.limit;
            return this.filteredItems.slice(startIndex, startIndex + this.limit);
        },
        filteredItems: function() {
            var items = this.items;
            if(this.search) {
                var regex = new RegExp('.*' + escapeRegExp(this.search) + '.*', 'i');
                items = this.items.filter(function(row) {
                    for(key in row) {
                        if(regex.test(row[key])) {
                            return true
                        }
                    }
                    return false;
                });
            }
            return items;
        },
        pages: function() {
            var limit = this.limit;
            var items = this.filteredItems;
            var curPage = this.curPage;
            var length = items.length;
            var totalPages = this.totalPages;
            if(totalPages > 7) {
                var pages = []; // paginated pages

                // first page
                pages.push({index:1});
                // front cover
                if(curPage < 5) {
                    pages.push({index:2});
                } else {
                    pages.push({index:'...'});
                }
                // middle "3"
                var middle_start = curPage - 1;
                var middle_end = curPage + 2;
                if(curPage < 5) {
                    middle_start = 3;
                    middle_end = 6;
                } else if(curPage > totalPages - 3) {
                    middle_start = totalPages - 4;
                    middle_end = totalPages - 1;
                }
                for(var i = middle_start; i < middle_end; i++) {
                    pages.push({index: i});
                }
                // back cover
                if(curPage < totalPages - 3) {
                    pages.push({index:'...'});
                } else {
                    var back_cover = totalPages - 1;
                    pages.push({index:back_cover});
                }
                // last page
                pages.push({index:totalPages});

                return pages;
            } else {
                var pages = [];
                for(var i = 1; i <= totalPages; i++) {
                    pages.push({index: i});
                }
                return pages;
            }
        }
    },
    el: 'body',
    ready: function() {
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/data.json');
        xhr.onload = function() {
            if(xhr.status == 200) {
                var data = JSON.parse(xhr.responseText);
                // console.log(data);
                self.items = data.items;
            }
        }
        xhr.send();
    },
    methods: {
        changePage: function(page, e) {
            e.preventDefault();
            if(Number.isInteger(page)) {
                this.curPage = page;
            }
        },
        next: function(e) {
            e.preventDefault();
            if(this.curPage < this.totalPages)
            this.curPage++;
        },
        previous: function(e) {
            e.preventDefault();
            if(this.curPage > 1) {
                this.curPage--;
            }
        }
    }
});