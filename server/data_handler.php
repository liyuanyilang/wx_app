<?php
header("Content-Type:application/json;charset=utf-8");

$con=mysqli_connect("localhost:3306","root","hollyted.123","wx_app"); 
if (mysqli_connect_errno($con)) 
{ 
    echo "连接 MySQL 失败: " . mysqli_connect_error(); 
} 

mysqli_set_charset($con,'utf8');

$sql="SELECT * FROM articles ORDER BY datetime";


if( isset($_POST['id']) )
{
  $id = $_POST['id'];
  $sql="SELECT * FROM articles WHERE id = ".$id;
}

$result=mysqli_query($con,$sql);

$jarr = array();
while ($rows=mysqli_fetch_array($result,MYSQLI_ASSOC)){
  array_push($jarr,$rows);
}

echo json_encode($jarr);
