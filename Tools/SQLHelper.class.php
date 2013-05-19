<?php

	class SQLHelper{
		
		private $conn;
		private $dbname="yahoohack";
		private $username="root";
		private $password="hao1lie2";
		private $host="localhost";
		
		public function __construct(){
			$this->conn=mysql_connect($this->host,$this->username,$this->password);
			if(!$this->conn){
				die("连接失败".mysql_error());
			}
			mysql_select_db($this->dbname,$this->conn);
			mysql_query("set names utf8");
		}
		
		public function execute_dql($sql){
			$res=mysql_query($sql,$this->conn) or die(mysql_error());
			return $res;
		}
		
		public function execute_dql_array($sql){

			$arr=array();
			$res=mysql_query($sql,$this->conn) or die(mysql_error());
			$i=0;
			
			while($row=mysql_fetch_assoc($res)){
				$arr[$i++]=$row;
			}
			mysql_free_result($res);
			return $arr;
		}
		
		public function execute_dml($sql){
			$b=mysql_query($sql,$this->conn) or die(mysql_error());
			if(!$b){
				return 0;		//失败
			}else{
				if(mysql_affected_rows($this->conn)>0){
					return 1;	//表示执行成功
				}else{
					return 2;	//表示没有行受到影响
				}
			}
		}
		
		public function close_connect(){
			if(empty($this->conn)){
				mysql_close($this->conn);
			}
		}
		
	}

?>