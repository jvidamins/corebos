/*************************************************************************************************
 * Copyright 2020 JPL TSolucio, S.L. -- This file is a part of TSOLUCIO coreBOS Customizations.
* Licensed under the vtiger CRM Public License Version 1.1 (the "License"); you may not use this
* file except in compliance with the License. You can redistribute it and/or modify it
* under the terms of the License. JPL TSolucio, S.L. reserves all rights not expressly
* granted by the License. coreBOS distributed by JPL TSolucio S.L. is distributed in
* the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
* warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. Unless required by
* applicable law or agreed to in writing, software distributed under the License is
* distributed on an "AS IS" BASIS, WITHOUT ANY WARRANTIES OR CONDITIONS OF ANY KIND,
* either express or implied. See the License for the specific language governing
* permissions and limitations under the License. You may obtain a copy of the License
* at <http://corebos.org/documentation/doku.php?id=en:devel:vpl11>
*************************************************************************************************/
let module = '';
let PageSize = 20;
const tuiGrid = tui.Grid;
let dataGridInstance;
document.addEventListener('DOMContentLoaded', function () {
	ListView.ListViewJSON();
}, false);

const ListView = {
	/**
	 * Load the grid in default view
	 */
	ListViewJSON: (actionType = false, urlstring = '', searchtype = '') => {
		if (document.getElementById('curmodule') != undefined) {
			module = document.getElementById('curmodule').value;
		}
		GlobalVariable_getVariable('Application_ListView_PageSize', 20, module, '').then(function (response) {
			let obj = JSON.parse(response);
			PageSize = obj.Application_ListView_PageSize;
		});
		let url = 'index.php?module=Utilities&action=UtilitiesAjax&file=ExecuteFunctions&functiontocall=listViewJSON&formodule='+module;
		if (actionType == 'filter') {
			document.getElementById('basicsearchcolumns').innerHTML = '';
			document.basicSearch.search_text.value = '';
			ListView.ListViewFilter(url);
			document.getElementById('status').style.display = 'none';
		} else if (actionType == 'search') {
			ListView.ListViewSearch(url, urlstring, searchtype);
			document.getElementById('status').style.display = 'none';
		} else if (actionType == 'massedit') {
			//use this function to reload data in every change
			ListView.ListViewReloadData();
			document.getElementById('status').style.display = 'none';
		} else {
			if (module != '' && module != undefined) {
				ListView.ListViewDefault(module, url);
			}
		}
	},
	/**
	 * Get all headers for table
	 */
	getColumnHeaders: (headerObj) => {
		let res = [];
		let header = {};
		let filter = {};
		for (let key in headerObj) {
			if (key == 'action') {
				header = {
					name: key,
					header: headerObj[key],
					sortable: false,
	      		};
	      	} else {
	      		if (key == 'assigned_user_id') {
	      			filter = {
						type: 'select',
	      			};
	      		} else {
	      			filter = {
						type: 'text',
	      			};
	      		}
				header = {
					name: key,
					header: headerObj[key],
					sortingType: 'desc',
					sortable: true,
					filter: filter
				};
			}
			res.push(header);
		}
		return res;
	},
	/**
	 * Load the default view in the first time
	 */
	ListViewDefault: (module, url) => {
		fetch(
			url+'&columns=true',
			{
				method: 'get',
				headers: {
					'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
				},
				credentials: 'same-origin',
			}
		).then(response => response.json()).then(response => {
			let headers = ListView.getColumnHeaders(response[0]);
			let filters = response[1];
			ListView.setFilters(filters);
			dataGridInstance = new tuiGrid({
				el: document.getElementById('listview-tui-grid'),
				columns: headers,
				rowHeaders: [{
					type: 'checkbox',
			        header: `
			          <label for="all-checkbox" class="checkbox">
			            <input type="checkbox" id="selectCurrentPageRec" onclick="toggleSelect_ListView(this.checked,'selected_id[]');ListView.getCheckedRows('currentPage', this);" name="_checked" />
			          </label>
			        `,
					renderer: {
	            		type: CheckboxRender
	          		}
				}],
				data: {
					api: {
						readData: {
							url: url,
							method: 'GET'
						}
					}
				},
				useClientSort: false,
				pageOptions: {
					perPage: PageSize
				},
				rowHeight: 'auto',
				bodyHeight: 'auto',
				scrollX: false,
				scrollY: true,
				columnOptions: {
					resizable: true
				},
				header: {
					align: 'left',
					valign: 'top'
				},
				onGridUpdated: (ev) => {
					ListView.updateData();
				}
			});
			tui.Grid.applyTheme('striped');
		});
	},
	/**
	 * Get the new headers in a onchange search
	 */
	 ListViewSearch: (url, urlstring, searchtype) => {
		dataGridInstance.clear();
	 	dataGridInstance.setRequestParams({'search': urlstring, 'searchtype': searchtype});
	 	dataGridInstance.reloadData();
		//update pagination onchange
		dataGridInstance.setPerPage(parseInt(PageSize));
	 	ListView.updateData();
	},
	/**
	 * Get the new headers in a onchange data
	 */
	 ListViewReloadData: () => {
		dataGridInstance.clear();
	 	dataGridInstance.setRequestParams({'search': '', 'searchtype': ''});
	 	dataGridInstance.reloadData();
	 	ListView.updateData();
	},
	/**
	 * Get the new headers in a onchange filter
	 */
	ListViewFilter: (url) => {
		dataGridInstance.setRequestParams({'search': '', 'searchtype': ''});
		dataGridInstance.clear();
		dataGridInstance.reloadData();
		fetch(
			url+'&columns=true',
			{
				method: 'get',
				headers: {
					'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
				},
				credentials: 'same-origin',
			}
		).then(response => response.json()).then(response => {
			let headers = ListView.getColumnHeaders(response[0]);
			let filters = response[1];
			//update options for basic search
			document.getElementById('bas_searchfield').innerHTML = '';
			for (let h in headers) {
				if (headers[h]['name'] != 'action') {
					let option = document.createElement('option');
					option.innerHTML = headers[h]['header'];
					option.value = headers[h]['name'];
					document.getElementById('bas_searchfield').appendChild(option);
				}
			}
			ListView.setFilters(filters, true);
		 	dataGridInstance.setColumns(headers);
		 	dataGridInstance.reloadData();
		});
		ListView.updateData();
		//update pagination onchange
		dataGridInstance.setPerPage(parseInt(PageSize));
	},
	/**
	 * Get all checked rows
	 */
	getAllCheckedRows: (type, el) => {
		let checkboxes = document.getElementsByName('selected_id[]');
		let checkboxesChecked = [];
		if (type == 'currentPage') {
			for (let i = 0; i < checkboxes.length; i++) {
				if (el != '' && el.checked == true) {
					checkboxesChecked.push(checkboxes[i].id);
				} else {
					checkboxesChecked = [];
				}
			}
		} else {
			for (let i = 0; i < checkboxes.length; i++) {
				if (checkboxes[i].checked) {
					checkboxesChecked.push(checkboxes[i].id);
				}
			}
		}
		return checkboxesChecked;
	},
	/**
	 * Get all checked rows to delete them
	 */
	getCheckedRows: (type, el = '') => {
		let checkedRows = ListView.getAllCheckedRows(type, el);
		let ids = [];
		let rowKeys = [];
		for (let id in checkedRows) {
			let recordId = dataGridInstance.getValue(parseInt(checkedRows[id]), 'recordid');
			ids.push(recordId);
			rowKeys.push(checkedRows[id]);
		}
		let	select_options = ids.join(';');
		if (!select_options.endsWith(';') && select_options != '') {
			select_options += ';';
		}
		document.getElementById('allselectedboxes').value = select_options;
		return rowKeys;
	},
	/**
	 * Remove all checked rows
	 */
	removeRows: (selectedType = '') => {
		dataGridInstance.reloadData();
		dataGridInstance.removeCheckedRows();
		document.getElementById('status').style.display = 'none';
		if (selectedType == 'all') {
			document.getElementById('gridRecordCountHeader').innerHTML = '';
			document.getElementById('gridRecordCountFooter').innerHTML = '';
			document.getElementById('numOfRows').value = '';
			document.getElementById('linkForSelectAll').style.display = 'none';
		} else {
			const total = ListView.updateData();
			document.getElementById('numOfRows').value = total;
			document.getElementById('count').innerHTML = total;
			document.getElementById('linkForSelectAll').style.display = 'none';
		}
	},
	/**
	 * Update data in every change
	 */
	updateData: () => {
		const gridInstance = dataGridInstance.store.data.pageOptions;
		const page = gridInstance.page;
		const totalCount = gridInstance.totalCount;
		const currentPageSize = dataGridInstance.getRowCount();
		const limit_start_rec = (page-1) * PageSize;
		const currentPage = (limit_start_rec + 1) + ' - ' + (limit_start_rec + currentPageSize);

		for (let i = 0; i < currentPageSize; i++) {
			let recordid = dataGridInstance.getValue(i, 'recordid');
			let referenceField = dataGridInstance.getValue(i, 'reference');
			let referenceValue = dataGridInstance.getValue(i, referenceField);
			let relatedRows = dataGridInstance.getValue(i, 'relatedRows');
			for (let fName in relatedRows) {
				let moduleName = relatedRows[fName][0];
				let fieldId = relatedRows[fName][1];
				let fieldValue = `<a href="index.php?module=${moduleName}&action=DetailView&record=${fieldId}">${relatedRows[fName][2]}<a>`;
				if (moduleName != '') {
					dataGridInstance.setValue(i, fName, fieldValue, false);
				} else {
					dataGridInstance.setValue(i, fName, '', false);
				}
			}
			let aAction = `
				<a href="index.php?module=${module}&action=EditView&record=${recordid}&return_module=${module}&return_action=index">${alert_arr['LNK_EDIT']}</a> | 
				<a href="javascript:confirmdelete('index.php?module=${module}&action=Delete&record=${recordid}&return_module=${module}&return_action=index&parenttab=ptab');">${alert_arr['LNK_DELETE']}</a>`;
			let aVal = '<a href="index.php?module='+module+'&action=DetailView&record='+recordid+'">'+referenceValue+'<a>';
			dataGridInstance.setValue(i, referenceField, aVal, false);
			dataGridInstance.setValue(i, 'action', aAction, false);
		}
		if (totalCount > 0) {
			document.getElementById('gridRecordCountHeader').innerHTML = alert_arr['LBL_SHOWING'] + currentPage + alert_arr['LBL_RECORDS'] + totalCount;
			document.getElementById('gridRecordCountFooter').innerHTML = alert_arr['LBL_SHOWING'] + currentPage + alert_arr['LBL_RECORDS'] + totalCount;
		} else {
			document.getElementById('gridRecordCountHeader').innerHTML = '';
			document.getElementById('gridRecordCountFooter').innerHTML = '';
		}
		return totalCount;
	},
	/**
	 * Update filter action in every change
	 */
	setFilters: (filters, reload = false) => {
		if (reload == true) {
			document.getElementById('filterOptions').innerHTML = '';
			document.getElementById('filterEditActions').innerHTML = '';
			document.getElementById('filterDeleteActions').innerHTML = '';
		}
		let select = document.createElement('select');
		select.id = 'viewname';
		select.name = 'viewname';
		select.className = 'small';
		select.setAttribute('onchange', 'showDefaultCustomView(this, "'+module+'", "'+filters.category+'")');
		select.innerHTML = filters.customview_html;
		document.getElementById('filterOptions').appendChild(select);

		//create filterActions
		let fedit = document.createElement('span');
		if (filters.edit_permit == 'yes') {
			fedit.innerHTML = `| <a href="index.php?module=${module}&action=CustomView&record=${filters.viewid}&parenttab=${filters.category}">${alert_arr['LNK_EDIT_ACTION']}</a> |`;
		} else {
			fedit.innerHTML = `| ${alert_arr['LNK_EDIT_ACTION']} |`;
		}
		document.getElementById('filterEditActions').appendChild(fedit);
		let fdelete = document.createElement('span');
		if (filters.delete_permit == 'yes') {
			fdelete.innerHTML = `<a href="javascript:confirmdelete('index.php?module=CustomView&action=Delete&dmodule=${module}&record=${filters.viewid}&parenttab=${filters.category}')">${alert_arr['LNK_DELETE_ACTION']}`;
		} else {
			fdelete.innerHTML = `${alert_arr['LNK_DELETE_ACTION']}`;
		}
		document.getElementById('filterDeleteActions').appendChild(fdelete);
	},
};