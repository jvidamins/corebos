<?php
/*************************************************************************************************
 * Copyright 2019 JPL TSolucio, S.L. -- This file is a part of TSOLUCIO coreBOS Customizations.
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

class installGenerateImageCodeWorkflowTask extends cbupdaterWorker {

	public function applyChange() {
		if ($this->hasError()) {
			$this->sendError();
		}
		if ($this->isApplied()) {
			$this->sendMsg('Changeset '.get_class($this).' already applied!');
		} else {
			include_once 'modules/com_vtiger_workflow/VTTaskManager.inc';
			$defaultModules = array('include' => array(), 'exclude'=>array());
			$taskType= array(
				'name'=>'Generate Image Code',
				'label'=>'Generate Image Code Workflow Task',
				'classname'=>'GenerateImageCodeWorkflowTask',
				'classpath'=>'modules/com_vtiger_workflow/tasks/GenerateImageCodeWorkflowTask.inc',
				'templatepath'=>'com_vtiger_workflow/taskforms/GenerateImageCodeTaskUi.tpl',
				'modules'=>$defaultModules,
				'sourcemodule'=>'',
			);
			VTTaskType::registerTaskType($taskType);
			$this->sendMsg('Changeset '.get_class($this).' applied!');
			$this->markApplied();
		}
		$this->finishExecution();
	}

	public function undoChange() {
		if ($this->hasError()) {
			$this->sendError();
		}
		if ($this->isApplied()) {
			global $adb;
			$result = $adb->pquery("SELECT * FROM `com_vtiger_workflowtasks` WHERE `task` like '%GenerateImageCode%'", array());
			if ($result && $adb->num_rows($result)>1) {
				$this->sendMsg(
					'<span style="font-size:large;weight:bold;">Workflows that use this task exist!! Please eliminate them before undoing this change.</span>'
				);
			} else {
				$adb->pquery(
					"DELETE FROM com_vtiger_workflow_tasktypes WHERE
						tasktypename = 'GenerateImageCodeWorkflowTask' and label = 'Generate Image Code Workflow Task' and classname = 'GenerateImageCodeWorkflowTask'",
					array()
				);
				$this->markUndone(false);
				$this->sendMsg('Changeset '.get_class($this).' undone!');
			}
		} else {
			$this->sendMsg('Changeset '.get_class($this).' not applied, it cannot be undone!');
		}
		$this->finishExecution();
	}

	public function isApplied() {
		$done = parent::isApplied();
		if (!$done) {
			global $adb;
			$result = $adb->pquery("SELECT * FROM com_vtiger_workflow_tasktypes where tasktypename='GenerateImageCode'", array());
			$done = ($result && $adb->num_rows($result)==1);
		}
		return $done;
	}
}