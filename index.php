<?php

	require_once dirname(__FILE__).'/'.'Tools/SQLHelper.class.php';
	
	$sqlHelper=new SQLHelper();
	
	if(isset($_GET['tag']))
	{
		$tagstring=$_GET['tag'];
		
		$tags=split(",",$tagstring);
		
		$tag1=$tags[0];
		$tag2=$tags[1];
		
		if(isset($_GET['name']))
		{
			$name=$_GET['name'];
		}
		
		if($name=='like')
		{
			$sql="update photo_tags set weight=weight+1 where tag1='$tag1' and tag2='$tag2'";
		}
		else if($name=='dislike')
		{
			$sql="update photo_tags set weight=weight-1 where tag1='$tag1' and tag2='$tag2'";
		}
		
		$sqlHelper->execute_dml($sql);
	}
	else
	{

		$size=100;
		
		$sql="select tag1,tag2 from photo_tags order by weight desc limit 0,$size";
		
		$arr=$sqlHelper->execute_dql_array($sql);
		
		$ranNum=rand(0,$size-1);
		
		echo $arr[$ranNum]['tag1'].",".$arr[$ranNum]['tag2'];

	}

?>